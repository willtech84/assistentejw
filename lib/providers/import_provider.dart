// lib/providers/import_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/import/designacoes_import_service.dart';
import 'database_provider.dart';

final importServiceProvider =
    Provider<DesignacoesImportService>((ref) {
  return DesignacoesImportService(
    ref.watch(databaseProvider),
  );
});
