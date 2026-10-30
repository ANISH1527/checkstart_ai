# project_report_docs/build_full_report.py
import os
import sys
import win32com.client
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

# Add directory to path
sys.path.insert(0, os.path.abspath("project_report_docs"))

from report_sections.sec0_preliminaries import build_preliminaries
from report_sections.sec1_intro import build_chapter1
from report_sections.sec2_litsurvey import build_chapter2
from report_sections.sec3_methodology import build_chapter3
from report_sections.sec4_modules import build_chapter4
from report_sections.sec5_results import build_chapter5
from report_sections.sec6_conclusions import build_chapter6
from report_sections.sec7_references_appendices import build_references_and_appendices

def build_complete_academic_report():
    print("Initializing Document setup...")
    doc = Document()
    
    # Configure A4 page with academic margins
    for section in doc.sections:
        section.page_width = Inches(8.27)   # A4 Width
        section.page_height = Inches(11.69) # A4 Height
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.25)  # Left binding margin
        section.right_margin = Inches(1.0)
        
        # Configure Footer with dynamic Word page numbering
        footer = section.footer
        p_ft = footer.paragraphs[0]
        p_ft.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_ft.paragraph_format.space_before = Pt(0)
        p_ft.paragraph_format.space_after = Pt(0)
        f_run = p_ft.add_run("CheckStart AI: Academic Project Report | Page ")
        f_run.font.name = "Times New Roman"
        f_run.font.size = Pt(9)
        f_run.font.color.rgb = RGBColor(128, 128, 128)
        
        fldChar1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
        instrText = parse_xml(r'<w:instrText %s xml:space="preserve"> PAGE </w:instrText>' % nsdecls('w'))
        fldChar2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
        fldChar3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
        f_run._r.append(fldChar1)
        f_run._r.append(instrText)
        f_run._r.append(fldChar2)
        f_run._r.append(fldChar3)

    # Base typography styling
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(12)
    normal_style.font.color.rgb = RGBColor(0, 0, 0)
    normal_style.paragraph_format.line_spacing = 1.35
    normal_style.paragraph_format.space_after = Pt(1.0)
    normal_style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    print("Building Section 0: Preliminary Pages...")
    build_preliminaries(doc)
    
    print("Building Chapter 1: Introduction...")
    build_chapter1(doc)
    
    print("Building Chapter 2: Literature Survey...")
    build_chapter2(doc)
    
    print("Building Chapter 3: Objectives and Methodology...")
    build_chapter3(doc)
    
    print("Building Chapter 4: Proposed System and Functional Modules...")
    build_chapter4(doc)
    
    print("Building Chapter 5: Results and Discussion...")
    build_chapter5(doc)
    
    print("Building Chapter 6: Conclusions and Future Work...")
    build_chapter6(doc)
    
    print("Building References and Appendices I–VII...")
    build_references_and_appendices(doc)

    import tempfile, shutil

    out_dir = os.path.abspath("project_report_docs/final_submission")
    os.makedirs(out_dir, exist_ok=True)
    docx_path = os.path.join(out_dir, "CheckStart_AI_Final_Project_Report.docx")
    pdf_path = os.path.join(out_dir, "CheckStart_AI_Final_Project_Report.pdf")

    # Save to user temp directory (guaranteed trusted location for Word COM)
    temp_docx = os.path.join(tempfile.gettempdir(), "CheckStart_AI_Final_Project_Report.docx")
    if os.path.exists(temp_docx):
        try:
            os.remove(temp_docx)
        except Exception:
            pass

    print(f"Saving temporary Word document to: {temp_docx}")
    doc.save(temp_docx)
    print("Word document generated successfully.")

    # Export to PDF via Microsoft Word COM
    print("Launching Microsoft Word COM for PDF export and pagination calculation...")
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0
    try:
        w_doc = word.Documents.Open(temp_docx)
        
        # Compute exact page count (wdStatisticPages = 2)
        page_count = w_doc.ComputeStatistics(2)
        print(f"Microsoft Word Computed Page Count: {page_count} pages")
        
        # Save as PDF (wdFormatPDF = 17)
        print(f"Exporting PDF to: {pdf_path}")
        w_doc.SaveAs(pdf_path, FileFormat=17)
        w_doc.Close(False)
        print("PDF export completed successfully.")
        
        # Copy verified DOCX to final submission
        shutil.copyfile(temp_docx, docx_path)
        print(f"Saved DOCX to: {docx_path}")
        
        return page_count, docx_path, pdf_path
    except Exception as e:
        print(f"Warning during PDF export: {e}")
        shutil.copyfile(temp_docx, docx_path)
        return None, docx_path, None
    finally:
        word.Quit()

if __name__ == "__main__":
    page_count, docx_path, pdf_path = build_complete_academic_report()
    print("==================================================")
    print("ACADEMIC PROJECT REPORT BUILD COMPLETE")
    print(f"Computed Pages: {page_count}")
    print(f"DOCX: {docx_path}")
    print(f"PDF:  {pdf_path}")
    print("==================================================")
