import logging
from typing import List, Dict, Any
from app.models.idea import Idea
from app.models.user import User
from app.models.embedding import IdeaEmbedding
from app.services.embedding_service import EmbeddingService
from app.services.faiss_service import faiss_service
from app.utils.hashing import get_password_hash

logger = logging.getLogger(__name__)

SAMPLE_VENTURES: List[Dict[str, Any]] = [
    {
        "title": "EduPath AI Assistant [SAMPLE]",
        "description": "[SAMPLE DATA] Personalized AI study path and automated flashcard generator for university engineering students preparing for semester exams.",
        "problem": "Engineering students struggle with massive exam syllabus volumes and lack structured revision schedules.",
        "target_customer": "Undergraduate engineering college students",
        "solution": "Adaptive algorithmic flashcards and syllabus milestones based on university exam archives.",
        "industry": "EdTech",
        "business_model": "B2C Subscription",
        "revenue_model": "$9.99/month per student subscription",
        "pricing": "$9.99/mo",
        "technology": "Next.js, FastAPI, NLP embedding models",
        "location": "North America / India",
        "competitors": "Quizlet, Anki",
        "usp": "Integrated university syllabus mapping",
        "current_stage": "prototype"
    },
    {
        "title": "MediDorm Health [SAMPLE]",
        "description": "[SAMPLE DATA] On-campus telehealth portal connecting dorm residents to campus health centers with automated 30-minute prescription delivery.",
        "problem": "Sick dorm students cannot easily travel across campus to health clinics when experiencing acute illness.",
        "target_customer": "On-campus college dorm residents",
        "solution": "Virtual triage by certified nurse practitioners and runner delivery for OTC/prescription meds.",
        "industry": "HealthTech",
        "business_model": "Institutional Partnership + Delivery Fee",
        "revenue_model": "$4.00 delivery fee + university health system contract",
        "pricing": "$4 delivery",
        "technology": "HIPAA-compliant WebRTC, React Native, Geo-routing",
        "location": "College Campuses",
        "competitors": "CVS On-demand, Campus Health Clinic Walk-in",
        "usp": "Dorm room-door delivery within 30 minutes",
        "current_stage": "pilot"
    },
    {
        "title": "FinDorm Split [SAMPLE]",
        "description": "[SAMPLE DATA] Automated shared roommate utility and grocery expense tracker with integrated UPI / bank settlement and micro-savings.",
        "problem": "Roommates experience friction when tracking irregular utility bills, groceries, and shared rent.",
        "target_customer": "Off-campus student roommates and co-living tenants",
        "solution": "OCR receipt scanning and scheduled automatic micro-settlements connected to bank accounts.",
        "industry": "FinTech",
        "business_model": "Freemium + Interchange",
        "revenue_model": "Free core splitting, 1.5% instant bank withdrawal fee",
        "pricing": "1.5% instant fee",
        "technology": "Python OCR, Plaid API, UPI SDK",
        "location": "Urban college towns",
        "competitors": "Splitwise, Venmo Groups",
        "usp": "Direct recurring bill synchronization and automated escrow",
        "current_stage": "MVP"
    },
    {
        "title": "Campus Quick Delivery [SAMPLE]",
        "description": "[SAMPLE DATA] Peer-to-peer 15-minute campus delivery network operated by student couriers walking between academic buildings and dorms.",
        "problem": "Commercial food delivery apps charge exorbitant fees ($6-$10) and take 45+ minutes to reach campus dorms.",
        "target_customer": "Dorm residents without cars ordering late-night snacks and meals",
        "solution": "Batch deliveries aggregated by walking student couriers between lectures and dorm clusters.",
        "industry": "Logistics",
        "business_model": "Commission + Delivery Fee",
        "revenue_model": "$1.50 batch delivery fee + 10% merchant commission",
        "pricing": "$1.50 delivery fee",
        "technology": "FastAPI, WebSockets live tracking, Flutter",
        "location": "Large university campuses",
        "competitors": "DoorDash, UberEats, Grubhub Campus",
        "usp": "Ultra-low delivery fee and dorm floor direct delivery",
        "current_stage": "MVP"
    },
    {
        "title": "EcoCampus Swap [SAMPLE]",
        "description": "[SAMPLE DATA] Student-to-student circular marketplace for textbook exchange, dorm mini-fridges, and furniture during move-out weeks.",
        "problem": "Massive waste and high resale friction during semester changeover and campus dorm move-out.",
        "target_customer": "Graduating seniors and incoming freshmen",
        "solution": "Verified .edu student marketplace with dorm pickup lockers and escrow payments.",
        "industry": "Marketplace",
        "business_model": "Commission Marketplace",
        "revenue_model": "5% transaction fee on completed student sales",
        "pricing": "5% fee",
        "technology": "React, Stripe Connect, Postgres",
        "location": "University Campuses",
        "competitors": "Facebook Marketplace, Craigslist",
        "usp": ".edu email verification and on-campus locker pickup",
        "current_stage": "prototype"
    }
]


def seed_sample_ventures_if_empty(db_session):
    """
    Seeds a small sample-ventures dataset (clearly marked as sample data)
    so similarity search is meaningful on a fresh database.
    """
    try:
        sample_ideas_count = db_session.query(Idea).filter(Idea.title.contains("[SAMPLE]")).count()
        if sample_ideas_count > 0:
            logger.info(f"Sample ventures dataset already seeded ({sample_ideas_count} found).")
            return

        # Ensure sample user exists
        sample_user = db_session.query(User).filter(User.email == "sample.ventures@checkstart.ai").first()
        if not sample_user:
            sample_user = User(
                name="CheckStart Sample Ventures",
                email="sample.ventures@checkstart.ai",
                password_hash=get_password_hash("SamplePass123!"),
                role="USER"
            )
            db_session.add(sample_user)
            db_session.commit()
            db_session.refresh(sample_user)

        emb_service = EmbeddingService()
        seeded_ideas = []

        for venture in SAMPLE_VENTURES:
            idea = Idea(
                user_id=sample_user.id,
                title=venture["title"],
                description=venture["description"],
                problem=venture.get("problem"),
                target_customer=venture.get("target_customer"),
                solution=venture.get("solution"),
                industry=venture.get("industry"),
                business_model=venture.get("business_model"),
                revenue_model=venture.get("revenue_model"),
                pricing=venture.get("pricing"),
                technology=venture.get("technology"),
                location=venture.get("location"),
                competitors=venture.get("competitors"),
                usp=venture.get("usp"),
                current_stage=venture.get("current_stage", "prototype"),
                version=1
            )
            db_session.add(idea)
            db_session.commit()
            db_session.refresh(idea)

            # Generate and save embedding
            text = f"{idea.title} {idea.description}"
            vec = emb_service.generate_embedding(text, idea_id=idea.id)
            serialized = emb_service.serialize_embedding(vec)
            text_hash = emb_service.cache_service.get_hash(text)

            idea_emb = IdeaEmbedding(
                idea_id=idea.id,
                version=1,
                model_name=emb_service.model_name,
                vector=serialized,
                text_hash=text_hash
            )
            db_session.add(idea_emb)
            db_session.commit()

            faiss_service.add_vector(idea.id, vec, persist=False)
            seeded_ideas.append(idea.id)

        faiss_service.persist_index()
        logger.info(f"Successfully seeded {len(seeded_ideas)} sample ventures into DB and FAISS index.")
    except Exception as e:
        db_session.rollback()
        logger.error(f"Error seeding sample ventures: {e}")
