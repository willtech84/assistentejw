// lib/services/pdf/pdf_classifier_service.dart

class PdfClassifierService {
  bool ehDesignacao(String texto) {
    final t = texto.toLowerCase();

    return t.contains("vida e ministério") ||
        t.contains("designação") ||
        t.contains("meeting schedule") ||
        t.contains("tesouros") ||
        t.contains("faça seu melhor");
  }
}
