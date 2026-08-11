// lib/screens/dashboard/dashboard_screen.dart

import 'package:flutter/material.dart';
import '../../widgets/status_card.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Dashboard"),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [

          StatusCard(
            titulo: "Designações",
            valor: "0",
            icon: Icons.assignment,
            color: Colors.blue,
          ),

          StatusCard(
            titulo: "PDFs Recebidos",
            valor: "0",
            icon: Icons.picture_as_pdf,
            color: Colors.red,
          ),

          StatusCard(
            titulo: "Envios",
            valor: "0",
            icon: Icons.send,
            color: Colors.green,
          ),

          StatusCard(
            titulo: "Pendentes",
            valor: "0",
            icon: Icons.schedule,
            color: Colors.orange,
          ),
        ],
      ),
    );
  }
}
