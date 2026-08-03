import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HomeScreen extends StatelessWidget {

  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      appBar: AppBar(
        title: const Text("Assistente JW"),
      ),

      body: ListView(

        children: [

          ListTile(
            leading: const Icon(Icons.assignment),
            title: const Text("Designações"),
            onTap: () => context.push("/designacoes"),
          ),

          ListTile(
            leading: const Icon(Icons.calendar_month),
            title: const Text("Agenda"),
            onTap: () => context.push("/agenda"),
          ),

          ListTile(
            leading: const Icon(Icons.picture_as_pdf),
            title: const Text("PDF Recebidos"),
            onTap: () => context.push("/share"),
          ),

          ListTile(
            leading: const Icon(Icons.settings),
            title: const Text("Configurações"),
            onTap: () => context.push("/configuracoes"),
          ),

          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text("Sobre"),
            onTap: () => context.push("/sobre"),
          ),

        ],
      ),
    );
  }
}
