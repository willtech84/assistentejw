// lib/providers/repositories_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../repositories/configuracoes_repository.dart';
import '../repositories/designacoes_repository.dart';
import '../repositories/estudantes_repository.dart';
import '../repositories/historico_repository.dart';
import '../repositories/pdf_repository.dart';

import 'database_provider.dart';

final configuracoesRepositoryProvider =
    Provider((ref) => ConfiguracoesRepository(ref.watch(databaseProvider)));

final designacoesRepositoryProvider =
    Provider((ref) => DesignacoesRepository(ref.watch(databaseProvider)));

final estudantesRepositoryProvider =
    Provider((ref) => EstudantesRepository(ref.watch(databaseProvider)));

final historicoRepositoryProvider =
    Provider((ref) => HistoricoRepository(ref.watch(databaseProvider)));

final pdfRepositoryProvider =
    Provider((ref) => PdfRepository(ref.watch(databaseProvider)));
