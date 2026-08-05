// lib/services/import/designacoes_import_service.dart

import 'dart:io';

import 'package:drift/drift.dart';

import '../../database/database.dart';
import '../excel/excel_import_service.dart';
import '../excel/meeting_schedule_parser.dart';

class DesignacoesImportService {
  final AppDatabase db;

  DesignacoesImportService(this.db);

  Future<int> importar(File arquivo) async {
    final excel = await ExcelImportService().abrir(arquivo);

    final itens = MeetingScheduleParser().parse(excel);

    await db.delete(db.designacoes).go();

    for (final item in itens) {
      await db.into(db.designacoes).insert(
            DesignacoesCompanion.insert(
              codigo: const Value(""),
              nome: Value(item.designacao),
              tipo: Value(item.designacao),
              estudante: Value(item.estudante),
              ajudante: Value(item.ajudante),
              dataReuniao: item.data,
              semana: Value(item.semana),
              sala: Value(item.sala),
            ),
          );
    }

    return itens.length;
  }
}
