// lib/services/excel/excel_import_service.dart

import 'dart:io';

import 'package:excel/excel.dart';

class ExcelImportService {
  Future<Excel> abrir(File arquivo) async {
    final bytes = await arquivo.readAsBytes();
    return Excel.decodeBytes(bytes);
  }
}
