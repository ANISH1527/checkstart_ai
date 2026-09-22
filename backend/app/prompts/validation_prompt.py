VALIDATION_PROMPT_V1 = """
You are an expert startup analyst and AI validator. Analyze the following startup idea strictly based on the provided information and general domain knowledge.

STARTUP IDEA DETAILS:
Title: {title}
Description: {description}
Problem: {problem}
Target Customer: {target_customer}
Solution: {solution}
Industry: {industry}
Business Model: {business_model}
Revenue Model: {revenue_model}
Pricing: {pricing}
Technology: {technology}

INSTRUCTIONS:
1. Evaluate the startup idea across the following 9 parameters:
   - market_demand
   - problem_solution_fit
   - target_customer_clarity
   - competition
   - uniqueness
   - technical_feasibility
   - business_potential
   - scalability
   - risk

2. For EVERY parameter, provide:
   - "score": An integer from 0 to 100
   - "confidence": An integer from 0 to 100 based on detail clarity
   - "status": One of ["SUPPORTED", "PARTIALLY_SUPPORTED", "INSUFFICIENT_INFORMATION"]
   - "reason": Clear concise reasoning for the score
   - "assumptions": List of explicit assumptions made
   - "evidence_required": Boolean indicating if external verification is critical

   CRITICAL RULE: If the input is vague or missing information for a parameter (e.g. product category unclear, missing pricing, missing target customer), do NOT convert UNKNOWN into a neutral score. Return a low score (20-35), low confidence (15-30), and set status = "INSUFFICIENT_INFORMATION".

3. Return lists for:
   - "strengths": Specific key strengths supported by actual user input
   - "weaknesses": Major weaknesses and missing details
   - "risks": Specific risk factors
   - "information_gaps": Critical missing details in the user's input

4. STRICT REQUIREMENT: Return ONLY valid JSON matching this structure:
{{
  "market_demand": {{"score": 80, "confidence": 75, "status": "SUPPORTED", "reason": "...", "assumptions": [], "evidence_required": true}},
  "problem_solution_fit": {{"score": 85, "confidence": 80, "status": "SUPPORTED", "reason": "...", "assumptions": [], "evidence_required": false}},
  "target_customer_clarity": {{"score": 75, "confidence": 80, "status": "SUPPORTED", "reason": "...", "assumptions": [], "evidence_required": false}},
  "competition": {{"score": 65, "confidence": 70, "status": "PARTIALLY_SUPPORTED", "reason": "...", "assumptions": [], "evidence_required": true}},
  "uniqueness": {{"score": 70, "confidence": 70, "status": "SUPPORTED", "reason": "...", "assumptions": [], "evidence_required": false}},
  "technical_feasibility": {{"score": 85, "confidence": 85, "status": "SUPPORTED", "reason": "...", "assumptions": [], "evidence_required": false}},
  "business_potential": {{"score": 75, "confidence": 75, "status": "SUPPORTED", "reason": "...", "assumptions": [], "evidence_required": false}},
  "scalability": {{"score": 70, "confidence": 70, "status": "SUPPORTED", "reason": "...", "assumptions": [], "evidence_required": false}},
  "risk": {{"score": 65, "confidence": 68, "status": "PARTIALLY_SUPPORTED", "reason": "...", "assumptions": [], "evidence_required": false}},
  "strengths": ["Strength 1"],
  "weaknesses": ["Weakness 1"],
  "risks": ["Risk 1"],
  "information_gaps": ["Gap 1"]
}}

Do NOT include any markdown formatting, preamble, or commentary outside the raw JSON object.
"""
