// lib/services/whatsapp/envio_service.dart

import 'dart:io';

import 'package:drift/drift.dart';

import '../../database/database.dart';
import 'mensagem_service.dart';
import 'whatsapp_service.dart';

class EnvioService {
  final AppDatabase db;

  final WhatsAppService whatsapp =
      WhatsAppService();

  EnvioService(this.db);

  Future<void> enviar(PdfsRecebido pdf) async {
    if (pdf.telefone.isEmpty) return;

    final mensagem = MensagemService().gerar(
      estudante: pdf.estudante,
      designacao: '',
      data: DateTime.now(),
    );

    await whatsapp.abrirConversa(
      telefone: pdf.telefone,
      mensagem: mensagem,
    );

    await db.update(db.pdfsRecebidos).replace(
          pdf.copyWith(
            enviadoWhatsapp: true,
          ),
        );

    await db.into(db.historicoEnvios).insert(
          HistoricoEnviosCompanion.insert(
            pdfId: Value(pdf.id),
            estudante: Value(pdf.estudante),
            telefone: Value(pdf.telefone),
            mensagem: Value(mensagem),
            sucesso: const Value(true),
          ),
        );
  }
}
