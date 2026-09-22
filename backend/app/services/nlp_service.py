import re
from typing import Dict, Any, List


class NLPService:
    def extract_attributes(self, text: str) -> Dict[str, Any]:
        """
        Lightweight NLP extractor for keyword, problem, target customer, solution, and tech cues.
        """
        words = re.findall(r"\b[A-Za-z]{4,}\b", text)
        stopwords = {"with", "this", "that", "from", "they", "will", "have", "more", "their", "about", "which", "when", "some"}
        keywords = list(dict.fromkeys([w.lower() for w in words if w.lower() not in stopwords]))[:10]

        # Extract heuristic sentence indicators
        sentences = [s.strip() for s in re.split(r"[.!?]", text) if s.strip()]

        problem_cues = ["problem", "issue", "struggle", "pain", "lack", "difficult", "hard", "challenge"]
        customer_cues = ["user", "customer", "business", "student", "developer", "client", "buyer", "people", "target"]
        solution_cues = ["solution", "platform", "app", "tool", "system", "service", "help", "provides", "allows"]

        extracted_problem = next((s for s in sentences if any(c in s.lower() for c in problem_cues)), None)
        extracted_customer = next((s for s in sentences if any(c in s.lower() for c in customer_cues)), None)
        extracted_solution = next((s for s in sentences if any(c in s.lower() for c in solution_cues)), None)

        return {
            "keywords": keywords,
            "extracted_problem": extracted_problem,
            "extracted_target_customer": extracted_customer,
            "extracted_solution": extracted_solution,
            "word_count": len(text.split())
        }
