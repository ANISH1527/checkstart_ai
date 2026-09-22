from typing import List, Dict, Any


class RAGService:
    def __init__(self, enabled: bool = False):
        self.enabled = enabled

    def retrieve_relevant_documents(self, query: str) -> List[Dict[str, Any]]:
        if not self.enabled:
            return []
        # Support pluggable knowledge base retrieval in future iterations
        return []
