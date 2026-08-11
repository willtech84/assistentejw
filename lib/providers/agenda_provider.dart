// lib/providers/agenda_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/agenda/agenda_service.dart';
import 'database_provider.dart';

final agendaProvider =
    Provider<AgendaService>((ref) {
  return AgendaService(
    ref.watch(databaseProvider),
  );
});
