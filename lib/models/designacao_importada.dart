// lib/models/designacao_importada.dart

class DesignacaoImportada {
  final String estudante;
  final String ajudante;
  final String designacao;
  final DateTime data;
  final String semana;
  final String sala;

  const DesignacaoImportada({
    required this.estudante,
    required this.ajudante,
    required this.designacao,
    required this.data,
    required this.semana,
    required this.sala,
  });
}
