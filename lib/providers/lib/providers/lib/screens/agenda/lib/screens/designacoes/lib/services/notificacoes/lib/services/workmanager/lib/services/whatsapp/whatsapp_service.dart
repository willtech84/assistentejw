// lib/services/whatsapp/whatsapp_service.dart

import 'dart:io';

import 'package:url_launcher/url_launcher.dart';

class WhatsAppService {
  Future<bool> abrirConversa({
    required String telefone,
    required String mensagem,
  }) async {
    final numero = telefone.replaceAll(RegExp(r'[^0-9]'), '');

    final uri = Uri.parse(
      'https://wa.me/55$numero?text=${Uri.encodeComponent(mensagem)}',
    );

    return launchUrl(
      uri,
      mode: LaunchMode.externalApplication,
    );
  }

  Future<bool> compartilharPdf(File arquivo) async {
    return arquivo.exists();
  }
}
