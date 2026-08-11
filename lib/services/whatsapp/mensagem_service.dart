// lib/services/whatsapp/mensagem_service.dart

class MensagemService {
  String gerar({
    required String estudante,
    required String designacao,
    required DateTime data,
    String? mensagemPadrao,
  }) {
    final texto = mensagemPadrao ??
        'Olá {nome}, segue sua designação desta semana.';

    return texto
        .replaceAll('{nome}', estudante)
        .replaceAll('{designacao}', designacao)
        .replaceAll('{data}',
            '${data.day}/${data.month}/${data.year}');
  }
}
