// lib/services/pdf/processador_pdf_service.dart

import 'dart:io';

import '../database/database.dart';
import 'nome_estudante_service.dart';
import 'pdf_text_service.dart';

class ProcessadorPdfService {
  final AppDatabase db;

  ProcessadorPdfService(this.db);

  Future<void> processar(File file) async {
    final texto = await PdfTextService().extrairTexto(file);

    final estudante =
        NomeEstudanteService().localizar(texto) ?? "";

    await db.into(db.pdfsRecebidos).insert(
          PdfsRecebidosCompanion.insert(
            nomeArquivo: Value(file.uri.pathSegments.last),
            caminhoArquivo: Value(file.path),
            estudante: Value(estudante),
          ),
        );
  }
}
