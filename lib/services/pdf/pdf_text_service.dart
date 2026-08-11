// lib/services/pdf/pdf_text_service.dart

import 'dart:io';

import 'package:syncfusion_flutter_pdf/pdf.dart';

class PdfTextService {
  Future<String> extrairTexto(File file) async {
    final bytes = await file.readAsBytes();

    final document = PdfDocument(inputBytes: bytes);

    final extractor = PdfTextExtractor(document);

    final texto = extractor.extractText();

    document.dispose();

    return texto;
  }
}
