from app.services.rule_service import RuleService


def test_rule_service_checks():
    rule_service = RuleService()

    # Test short text rule
    short_idea = {"title": "App", "description": "Too short"}
    results_short = rule_service.evaluate_rules(short_idea, [])
    min_len_rule = next(r for r in results_short if r["rule"] == "MINIMUM_LENGTH")
    assert min_len_rule["passed"] is False

    # Test missing target customer rule
    incomplete_idea = {
        "title": "Smart Health Tracker App Platform",
        "description": "Comprehensive wearable metrics aggregator providing real-time feedback.",
        "problem": "Health tracking is fragmented across multiple siloed apps."
    }
    results_inc = rule_service.evaluate_rules(incomplete_idea, [])
    cust_rule = next(r for r in results_inc if r["rule"] == "TARGET_CUSTOMER_MISSING")
    assert cust_rule["passed"] is False
