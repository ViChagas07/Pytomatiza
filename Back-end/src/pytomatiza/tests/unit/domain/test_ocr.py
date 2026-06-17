"""Unit tests for OCR domain models, exceptions, and capability matching."""

from __future__ import annotations

import pytest

from pytomatiza.domain.services.ocr.models import OCRHealth, OCRPage, OCRResult
from pytomatiza.domain.services.ocr.exceptions import (
    OCRError,
    OCRHealthError,
    OCRProcessingError,
    OCRProviderNotFound,
    OCRTimeout,
    OCRUnsupportedFormat,
)
from pytomatiza.domain.services.agent_capability import (
    find_alternative_agent,
    get_capability,
    list_all_agent_types,
    matches_capability,
)


# ── Models ──────────────────────────────────────────────────────────


class TestOCRPage:
    def test_create_page(self) -> None:
        page = OCRPage(page_number=1, text="Hello", confidence=85.5)
        assert page.page_number == 1
        assert page.text == "Hello"
        assert page.confidence == 85.5

    def test_empty_text(self) -> None:
        page = OCRPage(page_number=3, text="", confidence=0.0)
        assert page.text == ""
        assert page.confidence == 0.0


class TestOCRResult:
    def test_single_page(self) -> None:
        result = OCRResult(
            text="Sample text",
            language="por",
            provider="tesseract",
        )
        assert result.text == "Sample text"
        assert result.language == "por"
        assert result.provider == "tesseract"
        assert result.pages == []

    def test_auto_confidence_from_pages(self) -> None:
        result = OCRResult(
            text="",
            pages=[
                OCRPage(page_number=1, text="a", confidence=80.0),
                OCRPage(page_number=2, text="b", confidence=90.0),
            ],
        )
        assert result.confidence == 85.0

    def test_metadata_default(self) -> None:
        result = OCRResult(text="x")
        assert result.metadata == {}


class TestOCRHealth:
    def test_available(self) -> None:
        h = OCRHealth(provider="tesseract", available=True, language="por")
        assert h.available is True
        assert h.provider == "tesseract"

    def test_unavailable(self) -> None:
        h = OCRHealth(
            provider="tesseract",
            available=False,
            language="por",
            details={"error": "binary not found"},
        )
        assert h.available is False
        assert h.details["error"] == "binary not found"


# ── Exceptions ─────────────────────────────────────────────────────


class TestOCRExceptions:
    def test_base_exception(self) -> None:
        exc = OCRError("test", provider="tesseract")
        assert str(exc) == "test"
        assert exc.provider == "tesseract"

    def test_provider_not_found(self) -> None:
        exc = OCRProviderNotFound("textract")
        assert "textract" in str(exc)

    def test_processing_error(self) -> None:
        exc = OCRProcessingError("bad file", provider="tesseract")
        assert "bad file" in str(exc)

    def test_unsupported_format(self) -> None:
        exc = OCRUnsupportedFormat(".exe", provider="tesseract")
        assert ".exe" in str(exc)

    def test_timeout(self) -> None:
        exc = OCRTimeout(30.0, provider="tesseract")
        assert "30s" in str(exc)

    def test_health_error(self) -> None:
        exc = OCRHealthError("unhealthy", provider="tesseract")
        assert "unhealthy" in str(exc)


# ── Capability Matching ────────────────────────────────────────────


class TestAgentCapability:
    def test_get_capability_known(self) -> None:
        cap = get_capability("data")
        assert cap is not None
        assert cap.agent_type == "data"
        assert "ocr_processor" in cap.tools

    def test_get_capability_unknown(self) -> None:
        assert get_capability("nonexistent") is None

    def test_matches_ocr_keyword(self) -> None:
        assert matches_capability("data", "faça OCR desta fatura")

    def test_matches_spreadsheet_keyword(self) -> None:
        assert matches_capability("data", "processe esta planilha excel")

    def test_no_match_for_unrelated(self) -> None:
        assert not matches_capability("data", "gere um vídeo de apresentação")

    def test_content_matches_image(self) -> None:
        assert matches_capability("content", "crie uma imagem de capa")

    def test_productivity_matches_email(self) -> None:
        assert matches_capability("productivity", "envie um e-mail de boas-vindas")

    def test_find_alternative_for_image_request(self) -> None:
        alt = find_alternative_agent("gere uma imagem de capa para o artigo")
        assert alt is not None
        assert alt.agent_type == "content"

    def test_find_alternative_excludes_current(self) -> None:
        alt = find_alternative_agent(
            "gere uma imagem de capa", exclude_type="content"
        )
        # Next best should be something else (or None)
        assert alt is None or alt.agent_type != "content"

    def test_find_alternative_no_match(self) -> None:
        alt = find_alternative_agent("xyzzy foobar blarg")
        assert alt is None

    def test_list_all_agent_types(self) -> None:
        types = list_all_agent_types()
        assert len(types) == 5
        agent_type_names = {t["type"] for t in types}
        assert agent_type_names == {
            "productivity",
            "data",
            "content",
            "admin",
            "technical",
        }


# ── Intelligent Extraction ─────────────────────────────────────────


class TestExtraction:
    def test_extract_cpf(self) -> None:
        from pytomatiza.infrastructure.ocr.extraction import extract_fields

        fields = extract_fields("Meu CPF é 123.456.789-00")
        assert "123.456.789-00" in fields["cpf"]

    def test_extract_cnpj(self) -> None:
        from pytomatiza.infrastructure.ocr.extraction import extract_fields

        fields = extract_fields("CNPJ: 11.222.333/0001-81")
        assert "11.222.333/0001-81" in fields["cnpj"]

    def test_extract_email(self) -> None:
        from pytomatiza.infrastructure.ocr.extraction import extract_fields

        fields = extract_fields("Contato: joao@empresa.com.br")
        assert "joao@empresa.com.br" in fields["emails"]

    def test_extract_phone(self) -> None:
        from pytomatiza.infrastructure.ocr.extraction import extract_fields

        fields = extract_fields("Tel: (11) 98765-4321")
        assert len(fields["phones"]) > 0

    def test_extract_money(self) -> None:
        from pytomatiza.infrastructure.ocr.extraction import extract_fields

        fields = extract_fields("Valor: R$ 1.234,56")
        assert len(fields["money_values"]) > 0

    def test_extract_url(self) -> None:
        from pytomatiza.infrastructure.ocr.extraction import extract_fields

        fields = extract_fields("Acesse https://exemplo.com/doc")
        assert "https://exemplo.com/doc" in fields["urls"]

    def test_extract_date(self) -> None:
        from pytomatiza.infrastructure.ocr.extraction import extract_fields

        fields = extract_fields("Data: 15/06/2026")
        assert len(fields["dates"]) > 0

    def test_extract_empty_text(self) -> None:
        from pytomatiza.infrastructure.ocr.extraction import extract_fields

        fields = extract_fields("")
        assert all(len(v) == 0 for v in fields.values())

    def test_extract_structured(self) -> None:
        from pytomatiza.infrastructure.ocr.extraction import extract_structured

        s = extract_structured("CPF 111.222.333-44 email: a@b.com")
        assert s["cpf"] == "111.222.333-44"
        assert s["emails"] == ["a@b.com"]
