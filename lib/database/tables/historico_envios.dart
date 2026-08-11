// lib/database/tables/historico_envios.dart

import 'package:drift/drift.dart';

class HistoricoEnvios extends Table {
  IntColumn get id => integer().autoIncrement()();

  IntColumn get pdfId => integer().nullable()();

  IntColumn get estudanteId => integer().nullable()();

  TextColumn get estudante =>
      text().withDefault(const Constant(''))();

  TextColumn get telefone =>
      text().withDefault(const Constant(''))();

  TextColumn get mensagem =>
      text().withDefault(const Constant(''))();

  BoolColumn get sucesso =>
      boolean().withDefault(const Constant(false))();

  TextColumn get erro =>
      text().withDefault(const Constant(''))();

  DateTimeColumn get enviadoEm =>
      dateTime().withDefault(currentDateAndTime)();
}
