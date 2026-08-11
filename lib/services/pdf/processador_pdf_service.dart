// lib/services/pdf/processador_pdf_service.dart

import 'dart:io';

import 'package:drift/drift.dart';

import '../../database/database.dart';
import 'nome_estudante_service.dart';
import 'pdf_classifier_service.dart';
import 'pdf_text_service.dart';
import 'student_match_service.dart';

class ProcessadorPdfService {
  final AppDatabase db;

  ProcessadorPdfService(this.db);

  Future<void> processar(File arquivo) async {
    final texto = await PdfTextService().extrairTexto(arquivo);

    if (!PdfClassifierService().ehDesignacao(texto)) {
      return;
    }

    final nome =
        NomeEstudanteService().localizar(texto) ?? "";

    final estudante =
        await StudentMatchService(db).localizar(nome);

    await db.into(db.pdfsRecebidos).insert(
          PdfsRecebidosCompanion.insert(
            nomeArquivo: Value(
              arquivo.uri.pathSegments.last,
            ),
            caminhoArquivo: Value(
              arquivo.path,
            ),
            estudante: Value(nome),
            telefone: Value(
              estudante?.telefone ?? "",
            ),
          ),
        );
  }
}
