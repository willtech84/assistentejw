// lib/services/pdf/student_match_service.dart

import '../../database/database.dart';

class StudentMatchService {
  final AppDatabase db;

  StudentMatchService(this.db);

  Future<Estudante?> localizar(String nome) async {
    final pesquisa = nome.toLowerCase().trim();

    final lista = await db.select(db.estudantes).get();

    for (final estudante in lista) {
      if (estudante.nomePesquisa == pesquisa) {
        return estudante;
      }

      if (estudante.nome.toLowerCase() == pesquisa) {
        return estudante;
      }
    }

    return null;
  }
}
