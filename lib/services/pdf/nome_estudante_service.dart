// lib/services/pdf/nome_estudante_service.dart

class NomeEstudanteService {
  String? localizar(String texto) {
    final linhas = texto.split("\n");

    for (final linha in linhas) {
      final l = linha.trim();

      if (l.isEmpty) continue;

      if (l.length < 4) continue;

      if (l.contains(":")) continue;

      return l;
    }

    return null;
  }
}
