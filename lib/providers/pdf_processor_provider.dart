// lib/providers/pdf_processor_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/pdf/processador_pdf_service.dart';
import 'database_provider.dart';

final pdfProcessorProvider =
    Provider<ProcessadorPdfService>((ref) {
  return ProcessadorPdfService(
    ref.watch(databaseProvider),
  );
});
