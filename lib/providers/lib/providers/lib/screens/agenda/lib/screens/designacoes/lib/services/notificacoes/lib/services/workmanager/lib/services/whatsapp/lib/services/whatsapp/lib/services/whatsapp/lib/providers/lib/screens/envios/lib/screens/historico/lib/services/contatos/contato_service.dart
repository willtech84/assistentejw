// lib/services/contatos/contato_service.dart

import 'package:flutter_contacts/flutter_contacts.dart';

class ContatoService {
  Future<Contact?> localizar(String telefone) async {
    if (!await FlutterContacts.requestPermission()) {
      return null;
    }

    final contatos =
        await FlutterContacts.getContacts(
      withProperties: true,
    );

    for (final contato in contatos) {
      for (final numero in contato.phones) {
        final tel = numero.number.replaceAll(
          RegExp(r'[^0-9]'),
          '',
        );

        if (telefone.replaceAll(RegExp(r'[^0-9]'), '') ==
            tel) {
          return contato;
        }
      }
    }

    return null;
  }
}
