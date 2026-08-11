// lib/screens/agenda/agenda_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/agenda_provider.dart';

class AgendaScreen extends ConsumerWidget {
  const AgendaScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final agenda = ref.watch(agendaProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Agenda"),
      ),
      body: FutureBuilder(
        future: agenda.listarReunioes(),
        builder: (_, snapshot) {
          if (!snapshot.hasData) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          final lista = snapshot.data!;

          return ListView.builder(
            itemCount: lista.length,
            itemBuilder: (_, i) {
              final reuniao = lista[i];

              return ListTile(
                leading: const Icon(Icons.calendar_today),
                title: Text(reuniao.semana),
                subtitle: Text(
                  reuniao.data.toString(),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
