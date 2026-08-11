// lib/screens/configuracoes/aparencia_screen.dart

import 'package:flutter/material.dart';

class AparenciaScreen extends StatelessWidget {
  const AparenciaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Aparência"),
      ),
      body: ListView(
        children: const [

          SwitchListTile(
            value: false,
            onChanged: null,
            title: Text("Modo Escuro"),
          ),

          SwitchListTile(
            value: true,
            onChanged: null,
            title: Text("Material 3"),
          ),
        ],
      ),
    );
  }
}
