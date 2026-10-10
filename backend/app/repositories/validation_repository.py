from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.validation import ValidationResult
from app.models.score import ValidationScore
from app.models.evidence import Evidence
from app.models.competitor import Competitor
from app.models.recommendation import Recommendation
from app.models.audit_log import AuditLog
from app.models.embedding import Embedding


class ValidationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_validation_result(
        self,
        idea_id: int,
        version: int,
        model_name: str,
        model_version: str,
        prompt_version: str,
        input_hash: str,
        overall_score: float,
        confidence_score: float,
        classification: str,
        pipeline_timing: Optional[dict] = None,
        session_id: Optional[str] = None,
        framework_version: str = "v1.0",
        generation_mode: str = "ai_standard",
        degraded: bool = False,
        inputs_changed: Optional[dict] = None,
        summary: Optional[str] = None,
        strategic_verdict: Optional[str] = None,
        recommended_action: Optional[str] = None,
        analysis_json: Optional[dict] = None,
    ) -> ValidationResult:
        val_result = ValidationResult(
            idea_id=idea_id,
            version=version,
            model_name=model_name,
            model_version=model_version,
            prompt_version=prompt_version,
            input_hash=input_hash,
            overall_score=overall_score,
            confidence_score=confidence_score,
            classification=classification,
            pipeline_timing=pipeline_timing,
            session_id=session_id,
            framework_version=framework_version,
            generation_mode=generation_mode,
            degraded=degraded,
            inputs_changed=inputs_changed,
            summary=summary,
            strategic_verdict=strategic_verdict,
            recommended_action=recommended_action,
            analysis_json=analysis_json,
        )
        self.db.add(val_result)
        self.db.commit()
        self.db.refresh(val_result)
        return val_result

    def get_by_id(self, validation_id: int) -> Optional[ValidationResult]:
        return self.db.query(ValidationResult).filter(ValidationResult.id == validation_id).first()

    def save_scores(self, validation_id: int, scores: List[dict]):
        for item in scores:
            score_obj = ValidationScore(
                validation_id=validation_id,
                parameter=item["parameter"],
                score=item["score"],
                confidence=item["confidence"],
                reason=item["reason"]
            )
            self.db.add(score_obj)
        self.db.commit()

    def save_evidence(self, validation_id: int, evidence_list: List[dict]):
        for item in evidence_list:
            ev_obj = Evidence(
                validation_id=validation_id,
                source_name=item["source_name"],
                source_url=item.get("source_url"),
                claim=item["claim"],
                evidence_summary=item["evidence_summary"],
                reliability=item.get("reliability", "MEDIUM")
            )
            self.db.add(ev_obj)
        self.db.commit()

    def save_competitors(self, validation_id: int, competitors: List[dict]):
        for item in competitors:
            comp_obj = Competitor(
                validation_id=validation_id,
                name=item["name"],
                similarity_score=item["similarity_score"],
                target_customer=item.get("target_customer"),
                business_model=item.get("business_model"),
                pricing=item.get("pricing"),
                differentiator=item.get("differentiator"),
                source_url=item.get("source_url")
            )
            self.db.add(comp_obj)
        self.db.commit()

    def save_recommendations(self, validation_id: int, recommendations: List[dict]):
        import json
        for item in recommendations:
            if hasattr(item, "dict"):
                item_dict = item.dict()
            else:
                item_dict = item

            rec_obj = Recommendation(
                validation_id=validation_id,
                rec_id=item_dict.get("id"),
                parameter=item_dict.get("parameter"),
                current_score=item_dict.get("current_score"),
                severity=item_dict.get("severity"),
                root_cause=item_dict.get("root_cause"),
                missing_information=item_dict.get("missing_information"),
                objective=item_dict.get("objective"),
                action=item_dict.get("action", ""),
                category=item_dict.get("category", item_dict.get("parameter", "GENERAL")),
                priority=item_dict.get("priority", "HIGH"),
                success_metric=item_dict.get("success_metric", item_dict.get("validation_method", "Completion of action")),
                estimated_effort=item_dict.get("estimated_effort", item_dict.get("effort", "MEDIUM")),
                actionability=item_dict.get("actionability", "HIGH"),
                why_it_matters=item_dict.get("why_it_matters"),
                validation_method=item_dict.get("validation_method"),
                expected_impact=item_dict.get("expected_impact"),
                affected_parameters=json.dumps(item_dict.get("affected_parameters", [])),
                confidence=item_dict.get("confidence", 0.85),
                status=item_dict.get("status", "OPEN")
            )
            self.db.add(rec_obj)
        self.db.commit()

    def create_audit_log(self, validation_id: int, event: str, metadata: str):
        log_obj = AuditLog(
            validation_id=validation_id,
            event=event,
            log_metadata=metadata
        )
        self.db.add(log_obj)
        self.db.commit()

    def save_embedding(self, idea_id: int, model_name: str, vector_ref: str) -> Embedding:
        emb = Embedding(
            idea_id=idea_id,
            model_name=model_name,
            vector_reference=vector_ref
        )
        self.db.add(emb)
        self.db.commit()
        self.db.refresh(emb)
        return emb

    def get_latest_validation(self, idea_id: int) -> Optional[ValidationResult]:
        return self.db.query(ValidationResult).filter(
            ValidationResult.idea_id == idea_id
        ).order_by(ValidationResult.version.desc()).first()

    def get_validation_by_version(self, idea_id: int, version: int) -> Optional[ValidationResult]:
        return self.db.query(ValidationResult).filter(
            ValidationResult.idea_id == idea_id,
            ValidationResult.version == version
        ).first()

    def get_validation_history(self, idea_id: int) -> List[ValidationResult]:
        return self.db.query(ValidationResult).filter(
            ValidationResult.idea_id == idea_id
        ).order_by(ValidationResult.version.asc()).all()
