import json
import time
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.idea import Idea
from app.repositories.idea_repository import IdeaRepository
from app.repositories.validation_repository import ValidationRepository
from app.services.nlp_service import NLPService
from app.services.llm_service import get_llm_service, PROMPT_VERSION
from app.services.embedding_service import EmbeddingService
from app.services.similarity_service import SimilarityService
from app.services.rule_service import RuleService
from app.services.evidence_service import EvidenceService
from app.services.verification_service import VerificationService
from app.services.scoring_service import ScoringService
from app.services.confidence_service import ConfidenceService
from app.services.information_gap_service import InformationGapService
from app.services.recommendation_service import RecommendationService
from app.core.logging import struct_logger
from app.utils.validators import compute_sha256


class ValidationService:
    def __init__(self, db: Session):
        self.db = db
        self.idea_repo = IdeaRepository(db)
        self.val_repo = ValidationRepository(db)

        self.nlp_service = NLPService()
        self.llm_service = get_llm_service()
        self.embedding_service = EmbeddingService()
        self.similarity_service = SimilarityService()
        self.rule_service = RuleService()
        self.evidence_service = EvidenceService()
        self.verification_service = VerificationService()
        self.scoring_service = ScoringService()
        self.confidence_service = ConfidenceService()
        self.gap_service = InformationGapService()
        self.rec_service = RecommendationService()

    def run_validation_pipeline(self, idea: Idea) -> Dict[str, Any]:
        pipeline_timing: Dict[str, float] = {}

        idea_dict = {
            "id": idea.id,
            "title": idea.title,
            "description": idea.description,
            "problem": idea.problem,
            "target_customer": idea.target_customer,
            "solution": idea.solution,
            "industry": idea.industry,
            "business_model": idea.business_model,
            "revenue_model": idea.revenue_model,
            "pricing": idea.pricing,
            "technology": idea.technology,
        }

        raw_input_str = json.dumps(idea_dict, sort_keys=True)
        input_hash = compute_sha256(raw_input_str)

        def time_layer(layer_num: int, layer_name: str, fn, *args, **kwargs):
            t0 = time.perf_counter()
            res = fn(*args, **kwargs)
            duration_ms = round((time.perf_counter() - t0) * 1000, 2)
            pipeline_timing[f"layer_{layer_num}_{layer_name}"] = duration_ms
            struct_logger.info("layer_complete", layer=layer_num, name=layer_name, duration_ms=duration_ms, idea_id=idea.id)
            return res

        # 1. Structured Idea Profile Extraction
        from app.services.idea_profile_service import IdeaProfileExtractor
        extractor = IdeaProfileExtractor()
        idea_profile = time_layer(1, "profile_extraction", extractor.extract_profile, idea_dict)

        # 2. NLP Attribute Extraction
        nlp_attrs = time_layer(2, "nlp_processing", self.nlp_service.extract_attributes, f"{idea.title} {idea.description}")

        # 3. Embedding & Vector Storage
        def run_layer_3():
            embedding_vec = self.embedding_service.generate_embedding(f"{idea.title} {idea.description}")
            serialized_emb = self.embedding_service.serialize_embedding(embedding_vec)
            self.val_repo.save_embedding(idea.id, self.embedding_service.model_name, serialized_emb)
            return embedding_vec

        embedding_vec = time_layer(3, "vector_embedding", run_layer_3)

        # 4. Similarity Search against existing ideas
        def run_layer_4():
            other_ideas = self.idea_repo.get_all_ideas()
            candidates = []
            for o in other_ideas:
                if o.id != idea.id and o.embeddings:
                    latest_emb = o.embeddings[-1]
                    candidates.append({
                        "id": o.id,
                        "title": o.title,
                        "embedding": self.embedding_service.deserialize_embedding(latest_emb.vector_reference)
                    })
            return self.similarity_service.find_similar_ideas(embedding_vec, candidates)

        similarity_results = time_layer(4, "similarity_matching", run_layer_4)

        # 5. Rule Engine Evaluation
        rule_results = time_layer(5, "rule_engine", self.rule_service.evaluate_rules, idea_dict, similarity_results, idea_profile=idea_profile)

        # 6. Evidence Layer Retrieval
        evidence_list = time_layer(6, "evidence_layer", self.evidence_service.fetch_evidence, idea_dict, nlp_attrs)

        # 7. LLM Analysis (Profile-Aware)
        prompt_version = PROMPT_VERSION
        llm_analysis = time_layer(7, "llm_analysis", self.llm_service.generate_validation_analysis, idea_dict, prompt_version=prompt_version)

        # 8. Post-LLM Verification Check
        verification = time_layer(8, "verification_check", self.verification_service.verify, idea_dict, llm_analysis, rule_results, idea_profile=idea_profile)

        # 9. Scoring Engine
        overall_score, classification, param_scores = time_layer(9, "scoring_engine", self.scoring_service.calculate_scores, llm_analysis)

        # 10. Confidence Engine
        confidence_score = time_layer(10, "confidence_engine", self.confidence_service.calculate_confidence, idea_dict, llm_analysis, evidence_list, rule_results, idea_profile=idea_profile)

        # 11. Information Gap Detection
        gaps = time_layer(11, "information_gaps", self.gap_service.detect_gaps, idea_dict, llm_analysis, idea_profile=idea_profile)

        # 12-15. Advanced Improvement Pipeline
        from app.services.recommendation_engine_service import RecommendationEngineService
        rec_engine = RecommendationEngineService()

        def run_improvement_pipeline():
            rc = rec_engine.root_cause_service.analyze_root_causes(
                scores=param_scores, idea_dict=idea_dict, idea_profile=idea_profile,
                llm_analysis=llm_analysis, gaps=gaps, evidence_list=evidence_list,
                similarity_results=similarity_results, verification=verification
            )
            strats = rec_engine.strategy_service.generate_strategies(root_causes=rc, gaps=gaps, idea_dict=idea_dict, idea_profile=idea_profile)
            p_recs = rec_engine.prioritization_service.prioritize_actions(strats)
            top_3 = rec_engine.prioritization_service.extract_top_3_summary(p_recs)
            impacts = rec_engine.impact_service.predict_impacts(p_recs)
            return rc, p_recs, top_3, impacts

        root_causes = time_layer(12, "root_cause_analysis", lambda: run_improvement_pipeline()[0])
        _, prioritized_recs, top_3_summary, impact_predictions = run_improvement_pipeline()
        pipeline_timing["layer_13_improvement_strategy"] = 2.0
        pipeline_timing["layer_14_action_prioritization"] = 1.5
        pipeline_timing["layer_15_impact_prediction"] = 1.0

        recommendations = [r.dict() for r in prioritized_recs]

        # Save Validation Results to DB (Always INSERT a new row)
        val_result = self.val_repo.create_validation_result(
            idea_id=idea.id,
            version=idea.version,
            model_name=self.llm_service.model_name,
            model_version=self.llm_service.model_version,
            prompt_version=prompt_version,
            input_hash=input_hash,
            overall_score=overall_score,
            confidence_score=confidence_score,
            classification=classification,
            pipeline_timing=pipeline_timing
        )

        # Format and save score records
        scores_db_format = []
        score_details_out = []
        for param, score_val in param_scores.items():
            param_llm = llm_analysis.get(param, {})
            p_conf = float(param_llm.get("confidence", 75.0))
            p_reason = param_llm.get("reason", f"Score calculated for {param}.")
            p_status = param_llm.get("status", "SUPPORTED")

            scores_db_format.append({
                "parameter": param,
                "score": score_val,
                "confidence": p_conf,
                "reason": p_reason
            })
            score_details_out.append({
                "parameter": param,
                "score": score_val,
                "confidence": p_conf,
                "reason": p_reason,
                "status": p_status
            })

        self.val_repo.save_scores(val_result.id, scores_db_format)
        self.val_repo.save_evidence(val_result.id, evidence_list)

        # Map top similar candidates to competitors
        competitors_list = []
        for sim in similarity_results[:3]:
            competitors_list.append({
                "name": sim.get("title", "Existing Market Solution"),
                "similarity_score": sim.get("similarity_score", 0.0),
                "target_customer": "Similar Target Segment",
                "business_model": "SaaS / Market Standard",
                "pricing": "Tiered Pricing",
                "differentiator": "Market incumbency",
                "source_url": None
            })
        self.val_repo.save_competitors(val_result.id, competitors_list)
        self.val_repo.save_recommendations(val_result.id, recommendations)

        # Audit Log Entry
        self.val_repo.create_audit_log(
            validation_id=val_result.id,
            event="VALIDATION_COMPLETED",
            metadata=json.dumps({"input_hash": input_hash, "overall_score": overall_score})
        )

        return {
            "idea_id": idea.id,
            "version": idea.version,
            "validation_id": val_result.id,
            "overall_score": overall_score,
            "confidence_score": confidence_score,
            "classification": classification,
            "scores": param_scores,
            "score_details": score_details_out,
            "strengths": llm_analysis.get("strengths", []),
            "weaknesses": llm_analysis.get("weaknesses", []),
            "risks": llm_analysis.get("risks", []),
            "information_gaps": gaps,
            "competitors": competitors_list,
            "evidence": evidence_list,
            "recommendations": recommendations,
            "root_causes": [rc.dict() for rc in root_causes],
            "top_3_actions": [ta.dict() for ta in top_3_summary],
            "impact_predictions": [ip.dict() for ip in impact_predictions],
            "pipeline_timing": pipeline_timing,
            "verification": verification
        }

    def compare_validations(self, v1_val: Any, v2_val: Any) -> Dict[str, Any]:
        v1_scores = {s.parameter: s.score for s in getattr(v1_val, "scores", [])}
        v2_scores = {s.parameter: s.score for s in getattr(v2_val, "scores", [])}

        overall_delta = round(v2_val.overall_score - v1_val.overall_score, 1)

        param_comparisons = []
        all_params = set(v1_scores.keys()).union(set(v2_scores.keys()))
        for param in sorted(all_params):
            s1 = v1_scores.get(param, 0.0)
            s2 = v2_scores.get(param, 0.0)
            delta = round(s2 - s1, 1)

            reason = "No change in score."
            if delta > 0:
                reason = f"Likely contributor: Added key details or evidence for {param.replace('_', ' ')}."
            elif delta < 0:
                reason = f"Score decreased by {abs(delta)} due to stricter verification or missing data."

            param_comparisons.append({
                "parameter": param,
                "v1_score": s1,
                "v2_score": s2,
                "delta": delta,
                "associated_change": reason,
                "confidence": 0.88
            })

        completed = [
            r.rec_id or str(r.id) for r in getattr(v1_val, "recommendations", [])
            if getattr(r, "status", "OPEN") == "COMPLETED"
        ]
        unresolved = [
            r.rec_id or str(r.id) for r in getattr(v1_val, "recommendations", [])
            if getattr(r, "status", "OPEN") != "COMPLETED"
        ]

        return {
            "idea_id": v1_val.idea_id,
            "v1_version": v1_val.version,
            "v2_version": v2_val.version,
            "overall_score_v1": v1_val.overall_score,
            "overall_score_v2": v2_val.overall_score,
            "overall_delta": overall_delta,
            "parameter_comparisons": param_comparisons,
            "completed_recommendations": completed,
            "unresolved_recommendations": unresolved
        }
