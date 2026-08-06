// lib/services/share/share_receiver_manager.dart

import 'dart:io';

import 'package:receive_sharing_intent/receive_sharing_intent.dart';

import '../../database/database.dart';
import '../pdf/processador_pdf_service.dart';

class ShareReceiverManager {
  final AppDatabase db;

  ShareReceiverManager(this.db);

  Future<void> iniciar() async {
    ReceiveSharingIntent.instance
        .getMediaStream()
        .listen((files) async {
      for (final file in files) {
        await ProcessadorPdfService(db)
            .processar(File(file.path));
      }
    });

    final inicial =
        await ReceiveSharingIntent.instance.getInitialMedia();

    for (final file in inicial) {
      await ProcessadorPdfService(db)
          .processar(File(file.path));
    }
  }
}
