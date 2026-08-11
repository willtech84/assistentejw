// lib/database/database.dart

import 'package:drift/drift.dart';

import 'database_connection.dart';

import 'tables/configuracoes.dart';
import 'tables/designacoes.dart';
import 'tables/estudantes.dart';
import 'tables/reunioes.dart';
import 'tables/pdfs_recebidos.dart';
import 'tables/historico_envios.dart';

part 'database.g.dart';

@DriftDatabase(
  tables: [
    Configuracoes,
    Designacoes,
    Estudantes,
    Reunioes,
    PdfsRecebidos,
    HistoricoEnvios,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(openConnection());

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) async {
          await m.createAll();
        },
      );
}
