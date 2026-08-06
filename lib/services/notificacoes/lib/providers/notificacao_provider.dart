// lib/providers/notificacao_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/notificacoes/notificacao_service.dart';

final notificacaoProvider =
    Provider<NotificacaoService>((ref) {
  final service = NotificacaoService();

  service.iniciar();

  return service;
});
