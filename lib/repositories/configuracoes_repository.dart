// lib/repositories/configuracoes_repository.dart

import '../database/database.dart';

class ConfiguracoesRepository {
  final AppDatabase db;

  ConfiguracoesRepository(this.db);

  Future<Configuracoe?> obter() async {
    return await db.select(db.configuracoes).getSingleOrNull();
  }

  Future<int> salvar(ConfiguracoesCompanion dados) async {
    final atual = await obter();

    if (atual == null) {
      return db.into(db.configuracoes).insert(dados);
    }

    await (db.update(db.configuracoes)
          ..where((t) => t.id.equals(atual.id)))
        .write(dados);

    return atual.id;
  }
}
