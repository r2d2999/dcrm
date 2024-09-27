import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';

interface HorarioFila {
  hora: string;
  Lunes: string[];
  Martes: string[];
  Miércoles: string[];
  Jueves: string[];
  Viernes: string[];
}

type DiaSemana = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';

interface Materia {
  horario: {
    Lunes: { horaInicio: string; horaFin: string };
    Martes: { horaInicio: string; horaFin: string };
    Miércoles: { horaInicio: string; horaFin: string };
    Jueves: { horaInicio: string; horaFin: string };
    Viernes: { horaInicio: string; horaFin: string };
  };
  nombre: string;
}

interface Profesor {
  horarioLaboral: {
    Lunes: any[];
    Martes: any[];
    Miércoles: any[];
    Jueves: any[];
    Viernes: any[];
  };
}

interface Tipo {
  userType: any;
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, MatTableModule],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit {
  diasDeLaSemana: DiaSemana[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  horas = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'];
  horario: HorarioFila[] = [];
  columnas: string[] = ['hora', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  constructor(
    public dialogRef: MatDialogRef<ScheduleComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tipo: Tipo; profesor: Profesor; materias: Materia[] }
  ) {
    this.generarHorario();
  }

  ngOnInit(): void {
    console.log("TIPO:", this.data.tipo);
    console.log("profesor:", this.data.profesor);
    console.log(this.data.materias);

    if (this.data.tipo.userType === 'student') {
      console.log("es estudiante");
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  generarHorario(): void {
    this.horario = [];

    this.horas.forEach(hora => {
      const fila: HorarioFila = {
        hora,
        Lunes: [],
        Martes: [],
        Miércoles: [],
        Jueves: [],
        Viernes: []
      };

      this.diasDeLaSemana.forEach(dia => {
        if (this.data.tipo.userType === 'student') {
          // Para estudiantes, obtenemos las materias directamente
          fila[dia] = this.obtenerMateriasPorHoraEstudiante(hora, dia);

          
        } else {
          // Para profesores, utilizamos el horario laboral
          const horarioDia = this.data.profesor.horarioLaboral[dia];
          if (horarioDia) {
            fila[dia] = this.obtenerMateriasPorHora(hora, dia);
          }
        }
      });

      this.horario.push(fila);
    });

    // Agrega el console.log aquí para ver el estado final de this.horario
    console.log("Horario completo:", this.horario);
}

  obtenerMateriasPorHora(hora: string, dia: DiaSemana): string[] {
    return this.data.materias.filter(materia => {
      const horarioMateria = materia.horario[dia];
      return horarioMateria && horarioMateria.horaInicio <= hora && horarioMateria.horaFin > hora;
    }).map(materia => materia.nombre);
  }

  obtenerMateriasPorHoraEstudiante(hora: string, dia: DiaSemana): string[] {
    return this.data.materias.filter(materia => {
      const horarioMateria = materia.horario[dia];
      return horarioMateria && horarioMateria.horaInicio <= hora && horarioMateria.horaFin > hora;
    }).map(materia => materia.nombre);
  }
}
