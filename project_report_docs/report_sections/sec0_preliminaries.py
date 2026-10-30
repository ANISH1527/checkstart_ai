# project_report_docs/report_sections/sec0_preliminaries.py
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
from .helpers import add_p, add_bullet, set_table_borders, set_cell_background, set_cell_margins, make_row_header, make_row_cant_split

def create_toc_table(doc, headers, data, col_widths=None):
    tbl = doc.add_table(rows=len(data) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl, color="E5E7EB", sz="2")
    
    hdr_row = tbl.rows[0]
    make_row_header(hdr_row)
    for i, title in enumerate(headers):
        cell = hdr_row.cells[i]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=50, bottom=50, left=90, right=90)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.05
        r = p.add_run(title)
        r.font.name = "Times New Roman"
        r.font.size = Pt(9.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    for r_idx, row_data in enumerate(data):
        row = tbl.rows[r_idx + 1]
        make_row_cant_split(row)
        bg = "F9FAFB" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=30, bottom=30, left=80, right=80)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.05
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx == 0 else WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(str(val))
            r.font.name = "Times New Roman"
            r.font.size = Pt(9.0)
            if str(val).startswith("CHAPTER") or str(val) in ("REFERENCES", "APPENDICES"):
                r.font.bold = True
                
    if col_widths:
        for row in tbl.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = Inches(width)
                
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(2)
    return tbl

def build_preliminaries(doc):
    # 1. TITLE PAGE
    p_title_pre = doc.add_paragraph()
    p_title_pre.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title_pre.paragraph_format.space_before = Pt(20)
    p_title_pre.paragraph_format.space_after = Pt(6)
    r_main_title = p_title_pre.add_run("CHECKSTART AI: AI-ASSISTED STARTUP IDEA VALIDATION AND STRATEGIC RECOMMENDATION PLATFORM\n")
    r_main_title.font.name = "Times New Roman"
    r_main_title.font.size = Pt(17)
    r_main_title.font.bold = True
    r_main_title.font.color.rgb = RGBColor(30, 58, 138)
    
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(6)
    p_sub.paragraph_format.space_after = Pt(14)
    r_sub = p_sub.add_run("A Project Report Submitted in Partial Fulfilment of the Requirements for the Degree of\n")
    r_sub.font.name = "Times New Roman"
    r_sub.font.size = Pt(11.5)
    r_sub.font.italic = True
    
    r_deg = p_sub.add_run("BACHELOR OF TECHNOLOGY\nIN\nCOMPUTER SCIENCE AND ENGINEERING\n")
    r_deg.font.name = "Times New Roman"
    r_deg.font.size = Pt(12)
    r_deg.font.bold = True
    
    p_by = doc.add_paragraph()
    p_by.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_by.paragraph_format.space_before = Pt(10)
    p_by.paragraph_format.space_after = Pt(4)
    r_by = p_by.add_run("Submitted by:\n")
    r_by.font.name = "Times New Roman"
    r_by.font.size = Pt(11.5)
    r_by.font.italic = True
    
    r_names = p_by.add_run("[STUDENT FULL NAME(S)]\n(University Roll No.: [ROLL NUMBER PLACEHOLDER])\n(Registration No.: [REGISTRATION NUMBER PLACEHOLDER])\n")
    r_names.font.name = "Times New Roman"
    r_names.font.size = Pt(11.5)
    r_names.font.bold = True
    
    p_guide = doc.add_paragraph()
    p_guide.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_guide.paragraph_format.space_before = Pt(10)
    p_guide.paragraph_format.space_after = Pt(14)
    r_gpre = p_guide.add_run("Under the Guidance and Supervision of:\n")
    r_gpre.font.name = "Times New Roman"
    r_gpre.font.size = Pt(11.5)
    r_gpre.font.italic = True
    r_gname = p_guide.add_run("[SUPERVISOR NAME PLACEHOLDER]\n[DESIGNATION / DEPARTMENT PLACEHOLDER]\n")
    r_gname.font.name = "Times New Roman"
    r_gname.font.size = Pt(11.5)
    r_gname.font.bold = True
    
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(16)
    p_inst.paragraph_format.space_after = Pt(0)
    r_inst = p_inst.add_run("DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING\n[INSTITUTION / COLLEGE NAME PLACEHOLDER]\n[AFFILIATED UNIVERSITY NAME PLACEHOLDER]\nACADEMIC YEAR 2025–2026\nOCTOBER 2026")
    r_inst.font.name = "Times New Roman"
    r_inst.font.size = Pt(11.5)
    r_inst.font.bold = True
    
    # 2. STUDENT DECLARATION
    doc.add_page_break()
    p_dec_hd = doc.add_paragraph()
    p_dec_hd.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_dec_hd.paragraph_format.space_before = Pt(16)
    p_dec_hd.paragraph_format.space_after = Pt(12)
    r_dh = p_dec_hd.add_run("DECLARATION BY THE CANDIDATE")
    r_dh.font.name = "Times New Roman"
    r_dh.font.size = Pt(14)
    r_dh.font.bold = True
    
    add_p(doc, "I/We hereby declare that the academic project work entitled \"CheckStart AI: AI-Assisted Startup Idea Validation and Strategic Recommendation Platform\" submitted to the Department of Computer Science and Engineering, [INSTITUTION NAME PLACEHOLDER], affiliated with [UNIVERSITY NAME PLACEHOLDER], is an authentic record of original engineering work carried out by me/us under the guidance and supervision of [SUPERVISOR NAME PLACEHOLDER], [DESIGNATION PLACEHOLDER].")
    add_p(doc, "I/We further declare that this project report, or any part thereof, has not been submitted previously to this or any other university or institution for the award of any degree, diploma, fellowship, or associate award.")
    add_p(doc, "All literature citations, external software packages, open-source libraries, and research papers referenced throughout this report have been explicitly cited and acknowledged in accordance with recognized academic conventions and institutional anti-plagiarism standards.")
    
    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.space_before = Pt(36)
    p_sig.paragraph_format.space_after = Pt(0)
    r_sig = p_sig.add_run("Place: [CAMPUS / CITY PLACEHOLDER]\nDate: [SUBMISSION DATE PLACEHOLDER]\n\n\n_____________________________________\nSignature of the Candidate(s)\nName(s): [STUDENT FULL NAME(S)]\nRoll No.: [ROLL NUMBER(S)]")
    r_sig.font.name = "Times New Roman"
    r_sig.font.size = Pt(10.5)
    
    # 3. CERTIFICATE OF PROJECT COMPLETION
    doc.add_page_break()
    p_cert_hd = doc.add_paragraph()
    p_cert_hd.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cert_hd.paragraph_format.space_before = Pt(16)
    p_cert_hd.paragraph_format.space_after = Pt(12)
    r_ch = p_cert_hd.add_run("CERTIFICATE OF PROJECT COMPLETION")
    r_ch.font.name = "Times New Roman"
    r_ch.font.size = Pt(14)
    r_ch.font.bold = True
    
    add_p(doc, "This is to certify that the project report entitled \"CheckStart AI: AI-Assisted Startup Idea Validation and Strategic Recommendation Platform\" is a bona fide record of the major project work executed by [STUDENT NAME PLACEHOLDER] (Roll No.: [ROLL NUMBER PLACEHOLDER]) in partial fulfilment of the requirements for the award of the degree of Bachelor of Technology in Computer Science and Engineering from [INSTITUTION NAME PLACEHOLDER], affiliated to [UNIVERSITY NAME PLACEHOLDER], during the academic year 2025–2026.")
    add_p(doc, "The project work has been inspected, reviewed, and approved as satisfying the academic standards and technical requirements stipulated by the university curriculum. It is further certified that the candidate has completed all required implementation, automated testing, and technical documentation stages successfully.")
    
    p_csig = doc.add_paragraph()
    p_csig.paragraph_format.space_before = Pt(50)
    p_csig.paragraph_format.space_after = Pt(0)
    r_csig = p_csig.add_run("______________________________                      ______________________________\n[SUPERVISOR NAME PLACEHOLDER]                       HEAD OF THE DEPARTMENT\nProject Supervisor / Faculty Guide                 Department of Computer Science & Engg.\n[DEPARTMENT / COLLEGE PLACEHOLDER]                 [COLLEGE NAME PLACEHOLDER]\n\n\n______________________________                      ______________________________\nINTERNAL EXAMINER                                  EXTERNAL EXAMINER\nDate: [EXAM DATE PLACEHOLDER]                      Date: [EXAM DATE PLACEHOLDER]")
    r_csig.font.name = "Times New Roman"
    r_csig.font.size = Pt(10.5)

    # 4. ACKNOWLEDGEMENTS
    doc.add_page_break()
    p_ack_hd = doc.add_paragraph()
    p_ack_hd.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_ack_hd.paragraph_format.space_before = Pt(16)
    p_ack_hd.paragraph_format.space_after = Pt(12)
    r_ah = p_ack_hd.add_run("ACKNOWLEDGEMENTS")
    r_ah.font.name = "Times New Roman"
    r_ah.font.size = Pt(14)
    r_ah.font.bold = True
    
    add_p(doc, "I/We take immense pleasure in expressing our deep gratitude and indebtedness to our esteemed project supervisor, [SUPERVISOR NAME PLACEHOLDER], [DESIGNATION PLACEHOLDER], Department of Computer Science and Engineering, for their invaluable guidance, constant encouragement, insightful critiques, and sustained technical mentoring throughout the conception, architectural design, and implementation of this project.")
    add_p(doc, "I/We express our sincere thanks to [HEAD OF DEPARTMENT NAME PLACEHOLDER], Head of the Department of Computer Science and Engineering, for providing the necessary infrastructural facilities, high-performance computing laboratories, and an encouraging academic environment conducive to research and engineering development.")
    add_p(doc, "I/We are profoundly grateful to [PRINCIPAL / DIRECTOR NAME PLACEHOLDER], Principal/Director of [COLLEGE NAME PLACEHOLDER], for granting us the administrative support and opportunity to pursue this ambitious project work within the collegiate incubation framework.")
    add_p(doc, "Special thanks are extended to our faculty members, technical laboratory coordinators, and fellow student colleagues in the university entrepreneurship cell whose constructive feedback during early user-interface evaluations contributed significantly toward refining the Socratic mentoring dialogue and multi-idea comparative visual models.")
    add_p(doc, "Finally, I/We wish to express our heartfelt appreciation to our parents, family members, and friends for their enduring patience, moral encouragement, and unconditional support throughout the course of our academic studies.")
    
    # 5. ABSTRACT
    doc.add_page_break()
    p_abs_hd = doc.add_paragraph()
    p_abs_hd.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_abs_hd.paragraph_format.space_before = Pt(16)
    p_abs_hd.paragraph_format.space_after = Pt(12)
    r_absh = p_abs_hd.add_run("ABSTRACT")
    r_absh.font.name = "Times New Roman"
    r_absh.font.size = Pt(14)
    r_absh.font.bold = True
    
    abs_text = (
        "Over ninety percent of early-stage technology ventures fail during their initial development phases, "
        "predominantly due to building products that lack demonstrated market demand, distinct customer personas, "
        "or sustainable unit economics. While contemporary founders increasingly consult general-purpose conversational "
        "Large Language Models for venture advice, these generative models consistently exhibit behavioral sycophancy, "
        "flattering unviable concepts and producing ungrounded, hallucinated metrics. To resolve these critical limitations, "
        "this study engineered and empirically validated CheckStart AI, a hybrid neuro-symbolic platform designed to provide "
        "rigorous, evidence-grounded venture feasibility assessment for student entrepreneurs and university incubators. "
        "The platform couples an interactive multi-turn conversational Socratic co-pilot with an automated fifteen-layer "
        "sequential validation pipeline. The system extracts structured venture attributes, computes dense semantic sentence "
        "embeddings using all-MiniLM-L6-v2 for cosine competitor overlap detection, queries generative reasoning models, "
        "enforces deterministic post-inference score overrides for missing commercial elements, and evaluates venture viability "
        "using an authoritative nine-dimension weighted mathematical engine totaling one hundred percent weight summation, "
        "rolling up into seven visual founder parameters. Empirical evaluation demonstrated the system's robustness across an "
        "automated test suite comprising eighty-five test cases spanning fifteen test modules, achieving a one-hundred percent "
        "pass rate within 218.72 seconds of execution. Quantitative discrimination experiments confirmed that the platform "
        "successfully differentiated viable enterprise proposals from vague and fraudulent concepts, enforcing an average viability "
        "score divergence exceeding forty points. End-to-end pipeline latency averaged 135 milliseconds under local heuristic "
        "execution and 3.8 seconds under cloud model inference, while the single-page application compiled cleanly across 2,772 "
        "modules in 29.27 seconds. The developed platform establishes an objective, reproducible framework for early-stage "
        "hypothesis testing, bridging qualitative entrepreneurial ideation with deterministic computational assessment."
    )
    add_p(doc, abs_text)
    
    p_kw = doc.add_paragraph()
    p_kw.paragraph_format.space_before = Pt(6)
    p_kw.paragraph_format.space_after = Pt(4)
    r_kw_title = p_kw.add_run("Keywords: ")
    r_kw_title.font.name = "Times New Roman"
    r_kw_title.font.size = Pt(11)
    r_kw_title.font.bold = True
    r_kws = p_kw.add_run("Startup Idea Validation, Large Language Models, Neuro-Symbolic AI, Vector Semantic Similarity, Socratic Mentoring, Decision Support Systems.")
    r_kws.font.name = "Times New Roman"
    r_kws.font.size = Pt(11)
    r_kws.font.italic = True
    
    # 6. TABLE OF CONTENTS
    doc.add_page_break()
    p_toc_hd = doc.add_paragraph()
    p_toc_hd.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_toc_hd.paragraph_format.space_before = Pt(16)
    p_toc_hd.paragraph_format.space_after = Pt(12)
    r_toch = p_toc_hd.add_run("TABLE OF CONTENTS")
    r_toch.font.name = "Times New Roman"
    r_toch.font.size = Pt(14)
    r_toch.font.bold = True
    
    toc_data = [
        ("Candidate Declaration", "ii"),
        ("Certificate of Project Completion", "iii"),
        ("Acknowledgements", "iv"),
        ("Abstract", "v"),
        ("List of Tables", "vii"),
        ("List of Figures", "viii"),
        ("Abbreviations and Nomenclature", "ix"),
        ("CHAPTER 1: INTRODUCTION", "10"),
        ("   1.1 Background of the Work", "10"),
        ("   1.2 Motivation and Scope of the Proposed Work", "11"),
        ("   1.3 Challenges in Automated Venture Feasibility Assessment", "13"),
        ("   1.4 Overview of the Proposed Hybrid Solution", "13"),
        ("   1.5 Problem Statement and Research Aim", "14"),
        ("   1.6 Key Engineering Contributions", "14"),
        ("   1.7 Organization of the Project Report", "15"),
        ("   1.8 Chapter Summary", "16"),
        ("CHAPTER 2: LITERATURE SURVEY", "17"),
        ("   2.1 Classical Venture Evaluation and the Lean Startup Paradigm", "17"),
        ("   2.2 Machine Learning and Predictive Modelling in Startup Longevity", "18"),
        ("   2.3 Dense Vector Representations and Sentence Embeddings", "18"),
        ("   2.4 Generative Large Language Models in Business Reasoning", "19"),
        ("   2.5 Behavioural Sycophancy and Flattery Bias in Aligned LLMs", "19"),
        ("   2.6 Confidence Calibration and Overconfidence in Neural Systems", "20"),
        ("   2.7 Retrieval-Augmented Generation and Benchmark Evidence", "20"),
        ("   2.8 Critical Analysis and Research Gap Identification", "21"),
        ("   2.9 Problem Identification and Proposed Methodological Justification", "21"),
        ("   2.10 Chapter Summary", "22"),
        ("CHAPTER 3: OBJECTIVES AND METHODOLOGY", "23"),
        ("   3.1 Measurable Objectives of the Proposed Work", "23"),
        ("   3.2 Proposed System Workflow and Block Diagram", "24"),
        ("   3.3 Selection of Components, Tools, and Techniques", "26"),
        ("   3.4 Overall Multi-Tier System Architecture", "28"),
        ("   3.5 Detailed 15-Layer Sequential Validation Pipeline", "29"),
        ("   3.6 Authoritative 9-Dimension Mathematical Scoring Model", "31"),
        ("   3.7 Seven-Parameter Visual Rollup and 5-Band Viability Rubric", "33"),
        ("   3.8 Dense Vector Semantic Similarity Model and Caching", "34"),
        ("   3.9 Deterministic Verification and Anti-Sycophancy Override Rules", "34"),
        ("   3.10 Multi-Factor Calibrated Confidence Engine", "35"),
        ("   3.11 Relational Database Design and Persistence", "36"),
        ("   3.12 REST API Design and Interface Contracts", "37"),
        ("   3.13 Automated Testing and Verification Strategy", "38"),
        ("   3.14 Security Controls, Reliability, and Observability", "39"),
        ("   3.15 Methodological Limitations and Ethical Safeguards", "39"),
        ("   3.16 Chapter Summary", "39"),
        ("CHAPTER 4: PROPOSED SYSTEM AND FUNCTIONAL MODULES", "41"),
        ("   4.1 System Overview and Design Rationale", "41"),
        ("   4.2 Module 1: User Authentication, RBAC, and Profile Management", "42"),
        ("   4.3 Module 2: Conversational Idea Inception and Socratic Mentorship", "42"),
        ("   4.4 Module 3: 15-Layer Validation Pipeline Orchestration Engine", "43"),
        ("   4.5 Module 4: Dense Vector Embedding and Semantic Competitor Retrieval", "44"),
        ("   4.6 Module 5: Deterministic Rule Verification and Score Override Engine", "44"),
        ("   4.7 Module 6: Authoritative 9-Dimension Scoring and Visual Rollup", "44"),
        ("   4.8 Module 7: Multi-Factor Calibrated Confidence Engine", "45"),
        ("   4.9 Module 8: Strategic Diagnosis, Root Cause, and Recommendation Engine", "45"),
        ("   4.10 Module 9: Multi-Idea Comparative Synthesis Matrix", "46"),
        ("   4.11 Module 10: Idea History, Versioning, and Delta Tracking Engine", "46"),
        ("   4.12 Module 11: Founder and Administrative Telemetry Dashboard", "47"),
        ("   4.13 User Interface Design and Component Hierarchy", "47"),
        ("   4.14 Inter-Module Data Flow and Error Handling", "47"),
        ("   4.15 Chapter Summary", "48"),
        ("CHAPTER 5: RESULTS AND DISCUSSION", "50"),
        ("   5.1 Experimental Environment and Verification Methodology", "50"),
        ("   5.2 Automated Backend Test Suite Execution Results", "50"),
        ("   5.3 Benchmark Discrimination and Ground-Truth Scenarios", "52"),
        ("   5.4 Frontend Production Compilation and Static Analysis", "53"),
        ("   5.5 Execution Latency Telemetry across the 15 Layers", "53"),
        ("   5.6 Result Visualizations and Comparative Tables", "54"),
        ("   5.7 Methodological Comparison with Published Research", "55"),
        ("   5.8 Significance, Practical Strengths, and Technical Limitations", "56"),
        ("   5.9 Cost-Benefit Analysis and Operational Feasibility", "56"),
        ("   5.10 Chapter Summary", "57"),
        ("CHAPTER 6: CONCLUSIONS AND FUTURE WORK", "58"),
        ("   6.1 Accomplished Work and Attainment of Objectives", "58"),
        ("   6.2 Key Evidence-Supported Findings", "59"),
        ("   6.3 Current Technical Limitations", "59"),
        ("   6.4 Directions for Future Research and Development", "60"),
        ("   6.5 Chapter Summary", "60"),
        ("REFERENCES", "61"),
        ("APPENDICES", "63"),
        ("   Appendix I: Bill of Materials and Software Inventory", "63"),
        ("   Appendix II: Critical Implementation Source Code Extracts", "64"),
        ("   Appendix III: Supplementary Verification Tables and Test Profiles", "66"),
        ("   Appendix IV: Publication Certificate Placeholder", "67"),
        ("   Appendix V: Publication Proof Placeholder", "67"),
        ("   Appendix VI: Work Contribution Statement", "67"),
        ("   Appendix VII: Plagiarism Clearance Placeholder", "68"),
    ]
    create_toc_table(doc, ["Report Section / Chapter", "Page No."], toc_data, col_widths=[5.5, 1.2])

    # 7. LIST OF TABLES & LIST OF FIGURES
    doc.add_page_break()
    p_lot_hd = doc.add_paragraph()
    p_lot_hd.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_lot_hd.paragraph_format.space_before = Pt(16)
    p_lot_hd.paragraph_format.space_after = Pt(10)
    r_loth = p_lot_hd.add_run("LIST OF TABLES")
    r_loth.font.name = "Times New Roman"
    r_loth.font.size = Pt(14)
    r_loth.font.bold = True
    
    lot_data = [
        ("Table 3.1", "Verified Technology Stack and Tool Specifications", "26"),
        ("Table 3.2", "Fifteen-Layer Sequential Validation Pipeline Specification", "29"),
        ("Table 3.3", "Authoritative 9-Dimension Scoring Weights Allocation", "32"),
        ("Table 3.4", "Five-Tier Viability Classification Rubric", "33"),
        ("Table 3.5", "Deterministic Override Rules Implemented in Layer 8", "35"),
        ("Table 3.6", "Relational Database Schema and Table Footprint", "36"),
        ("Table 4.1", "Functional Module Implementation Traceability Matrix", "41"),
        ("Table 4.2", "REST API Endpoint Inventory and Protocol Contracts", "47"),
        ("Table 5.1", "Automated Backend Test Suite Breakdown (85 Test Cases)", "50"),
        ("Table 5.2", "Quantitative Benchmark Discrimination Results", "52"),
        ("Table 5.3", "Frontend Production Build Asset Footprint", "53"),
        ("Table 5.4", "Fifteen-Layer Execution Latency Telemetry Breakdown", "53"),
        ("Table 5.5", "Methodological Comparison with Related Academic Approaches", "55"),
        ("Table 5.6", "Comprehensive Cost-Benefit and Infrastructure Analysis", "56"),
        ("Table App I.1", "Complete Software Component Inventory and Dependency Manifest", "63"),
        ("Table App III.1", "Extended Unit and Architectural Test Execution Profile", "66"),
    ]
    create_toc_table(doc, ["Table No.", "Table Title / Caption", "Page No."], lot_data, col_widths=[1.2, 4.5, 1.0])

    p_lof_hd = doc.add_paragraph()
    p_lof_hd.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_lof_hd.paragraph_format.space_before = Pt(16)
    p_lof_hd.paragraph_format.space_after = Pt(10)
    r_lofh = p_lof_hd.add_run("LIST OF FIGURES")
    r_lofh.font.name = "Times New Roman"
    r_lofh.font.size = Pt(14)
    r_lofh.font.bold = True
    
    lof_data = [
        ("Figure 3.1", "Overall Multi-Tier System Architecture Diagram", "28"),
        ("Figure 3.2", "The 15-Layer Sequential Validation Pipeline Architecture", "24"),
        ("Figure 3.4", "Complete Relational Database Entity-Relationship (ER) Model", "37"),
        ("Figure 4.1", "React Component Hierarchy and State Flow Architecture", "47"),
        ("Figure 5.1", "Benchmark Overall Score Discrimination Comparison", "54"),
        ("Figure 5.2", "Benchmark Calibrated Confidence Score Comparison", "55"),
        ("Figure 5.3", "Layer-by-Layer Execution Latency Profile (Mock vs Cloud)", "55"),
        ("Figure 5.4", "Application User Interface Screenshot Layout Guide", "55"),
    ]
    create_toc_table(doc, ["Figure No.", "Figure Title / Caption", "Page No."], lof_data, col_widths=[1.2, 4.5, 1.0])

    # 8. ABBREVIATIONS AND NOMENCLATURE
    doc.add_page_break()
    p_abb_hd = doc.add_paragraph()
    p_abb_hd.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_abb_hd.paragraph_format.space_before = Pt(16)
    p_abb_hd.paragraph_format.space_after = Pt(10)
    r_abbh = p_abb_hd.add_run("ABBREVIATIONS AND NOMENCLATURE")
    r_abbh.font.name = "Times New Roman"
    r_abbh.font.size = Pt(14)
    r_abbh.font.bold = True
    
    abb_data = [
        ("AI", "Artificial Intelligence"),
        ("API", "Application Programming Interface"),
        ("ASGI", "Asynchronous Server Gateway Interface"),
        ("B2B", "Business-to-Business"),
        ("CAC", "Customer Acquisition Cost"),
        ("CoT", "Chain-of-Thought Prompting"),
        ("CRUD", "Create, Read, Update, Delete"),
        ("CSS", "Cascading Style Sheets"),
        ("DOM", "Document Object Model"),
        ("ECE", "Expected Calibration Error"),
        ("GIS", "Google Identity Services"),
        ("HMR", "Hot Module Replacement"),
        ("HTTP", "Hypertext Transfer Protocol"),
        ("IP", "Intellectual Property / Internet Protocol"),
        ("JSON", "JavaScript Object Notation"),
        ("JWKS", "JSON Web Key Set"),
        ("JWT", "JSON Web Token"),
        ("LLM", "Large Language Model"),
        ("LTV", "Lifetime Value of Customer"),
        ("ML", "Machine Learning"),
        ("MVP", "Minimum Viable Product"),
        ("NLP", "Natural Language Processing"),
        ("OIDC", "OpenID Connect"),
        ("ORM", "Object-Relational Mapping"),
        ("RAG", "Retrieval-Augmented Generation"),
        ("RBAC", "Role-Based Access Control"),
        ("REST", "Representational State Transfer"),
        ("RLHF", "Reinforcement Learning from Human Feedback"),
        ("SaaS", "Software as a Service"),
        ("SBERT", "Sentence-BERT"),
        ("SHA", "Secure Hash Algorithm"),
        ("SPA", "Single-Page Application"),
        ("SQL", "Structured Query Language"),
        ("SSE", "Server-Sent Events"),
        ("TAM", "Total Addressable Market"),
        ("UI / UX", "User Interface / User Experience"),
        ("USPTO", "United States Patent and Trademark Office"),
        ("UUID", "Universally Unique Identifier"),
        ("VC", "Venture Capital / Venture Capitalist"),
        ("XSS", "Cross-Site Scripting"),
    ]
    create_toc_table(doc, ["Abbreviation", "Full Expanded Nomenclature"], abb_data, col_widths=[1.8, 4.9])
    print("Preliminaries updated with exact page links.")
