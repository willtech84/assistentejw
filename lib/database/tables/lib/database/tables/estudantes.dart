// lib/database/tables/estudantes.dart

import 'package:drift/drift.dart';

class Estudantes extends Table {
  IntColumn get id => integer().autoIncrement()();

  TextColumn get nome =>
      text().withDefault(const Constant(''))();

  TextColumn get nomePesquisa =>
      text().withDefault(const Constant(''))();

  TextColumn get telefone =>
      text().withDefault(const Constant(''))();

  TextColumn get email =>
      text().withDefault(const Constant(''))();

  TextColumn get endereco =>
      text().withDefault(const Constant(''))();

  TextColumn get observacoes =>
      text().withDefault(const Constant(''))();

  BoolColumn get ativo =>
      boolean().withDefault(const Constant(true))();

  BoolColumn get recebeWhatsapp =>
      boolean().withDefault(const Constant(true))();

  BoolColumn get recebeEmail =>
      boolean().withDefault(const Constant(false))();

  TextColumn get contatoId =>
      text().withDefault(const Constant(''))();

  DateTimeColumn get ultimoEnvio =>
      dateTime().nullable()();

  DateTimeColumn get criadoEm =>
      dateTime().withDefault(currentDateAndTime)();

  DateTimeColumn get atualizadoEm =>
      dateTime().withDefault(currentDateAndTime)();
}
