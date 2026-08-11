// lib/services/excel/meeting_schedule_parser.dart

import 'package:excel/excel.dart';

import '../../models/designacao_importada.dart';

class MeetingScheduleParser {
  List<DesignacaoImportada> parse(Excel excel) {
    final resultado = <DesignacaoImportada>[];

    for (final sheet in excel.tables.values) {
      if (sheet.maxRows <= 1) continue;

      for (int i = 1; i < sheet.maxRows; i++) {
        final row = sheet.row(i);

        if (row.isEmpty) continue;

        try {
          resultado.add(
            DesignacaoImportada(
              estudante: row[0]?.value?.toString() ?? "",
              ajudante: row[1]?.value?.toString() ?? "",
              designacao: row[2]?.value?.toString() ?? "",
              data: DateTime.tryParse(
                      row[3]?.value?.toString() ?? "") ??
                  DateTime.now(),
              semana: row[4]?.value?.toString() ?? "",
              sala: row.length > 5
                  ? row[5]?.value?.toString() ?? "Principal"
                  : "Principal",
            ),
          );
        } catch (_) {}
      }
    }

    return resultado;
  }
}
