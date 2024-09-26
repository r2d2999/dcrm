import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { GroupService } from '../../professor/group.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { HorariosService } from '../horarios.service';
import { RegisterUserService } from '../../auth/register-user.service';
import { Router } from '@angular/router';
import { UserService } from '../../auth/user.service';
import { SessionService } from '../../auth/session.service';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { ScheduleComponent } from '../../shared/schedule/schedule.component';



export interface Grupo {
  _id: string;
  name: string;
  profesor: string;
  cupo: number;
  materia: string;
  horario: {
      Lunes: { horaInicio: string; horaFin: string };
      Martes: { horaInicio: string; horaFin: string };
      Miércoles: { horaInicio: string; horaFin: string };
      Jueves: { horaInicio: string; horaFin: string };
      Viernes: { horaInicio: string; horaFin: string };
  };
}


@Component({
  selector: 'app-cargamaterias',
  standalone: true,
  imports: [NavbarComponent, CommonModule,
    MatDialogModule
  ],
  templateUrl: './cargamaterias.component.html',
  styleUrls: ['./cargamaterias.component.scss']
})
export class CargamateriasComponent implements OnInit {
  public user: any;
  public userId: any;
  public userName: any;
  public list_grupos: Grupo[] = [];
  public selectedMaterias: any[] = [];
  public closeCharge: boolean = false;

  constructor(private gService: GroupService, private hService: HorariosService, private uService: RegisterUserService,
    private router: Router, private userService: UserService, private sessionService: SessionService, private dialog: MatDialog) {}

  ngOnInit(): void {
    //this.sessionService.resetTimer();
    this.loadUserData();
    this.loadGroupData();
  }


  openPre(){
    const profesor = {
      name: this.userName,
    };
  
    this.dialog.open(ScheduleComponent, {
      data: {
        tipo: 'student',
        profesor: {
          name: this.userName,
          horarioLaboral: {
            Lunes: true,
            Martes: true,
            Miércoles: true,
            Jueves: true,
            Viernes: true,
          }
        },
        materias: this.selectedMaterias
      },
      width: '100%', // Ajusta el ancho como necesites (puedes usar '600px', '80%', etc.)
      height: 'auto', // Ajusta la altura si es necesario
      maxWidth: '800px', // Máximo ancho del modal
    });
  }


  loadUserData() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    if (this.user) {
      this.userId = this.user._id;
    }
  }

  loadGroupData() {
    this.gService.getGroups().subscribe({
      next: (data) => {
        this.list_grupos = data;
        console.log("grupos: ", this.list_grupos)
      },
      error: (error) => {
        console.error("Error al traer los grupos", error);
      }
    });
  }

  async updateStudent() {
    return new Promise<void>((resolve, reject) => {
      this.uService.updateInscritoT(this.userId, true).subscribe({
        next: () => {
          console.log("Estudiante actualizado con éxito");
          resolve();
        },
        error: (error) => {
          console.error("Error, no se pudo actualizar", error);
          reject(error);
        }
      });
    });
  }

  async updateDataB() {
    const horarioData = {
      alumno_id: this.userId,
      materias: this.selectedMaterias.map(materia => ({
        horario: materia.horario,
        _id: materia._id,
        name: materia.name,
        profesor: materia.profesor,
        cupo: materia.cupo,
        materia: materia.materia,
        alumno: this.userId
      }))
    };

    return new Promise<void>((resolve, reject) => {
      this.hService.createHorario(horarioData).subscribe({
        next: (response) => {
          console.log('Horario creado con éxito:', response);
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Tu carga horaria ha sido guardada correctamente.'
          });
          resolve();
        },
        error: (error) => {
          console.error('Error al crear horario:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al guardar tu carga horaria.'
          });
          reject(error);
        }
      });
    });
  }

  async imprimirCarga() {
    console.log("se va a imprimir");

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Finalizar Proceso',
      text: 'Al presionar aceptar terminarás tu proceso de inscripción y ya no podrás hacer ningún tipo de modificación.',
      showCancelButton: true,
      cancelButtonColor: 'red',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: 'green'
    });

    if (result.isConfirmed) {
      await this.printPDF();
      await this.updateDataB();
      await this.updateStudent();
      this.router.navigate(['/home']);
    } else {
      this.closeCharge = false;
    }
  }

  printPDF() {
    const data = document.getElementById('materias-seleccionadas');

    if (data) {
      return html2canvas(data).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const imgWidth = 190;
        const pageHeight = pdf.internal.pageSize.height;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        pdf.save('carga_academica.pdf');
      });
    }
    return Promise.resolve();
  }

  cerrarCarga() {
    console.log(this.selectedMaterias);

    Swal.fire({
      icon: 'warning',
      title: 'Cerrar Carga Horaria',
      text: '¿Estás seguro de querer cerrar tu carga de materias?',
      showCancelButton: true,
      cancelButtonColor: 'red',
      confirmButtonText: 'Terminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.closeCharge = true;
      }
    });
  }

  addSubject(grupo: Grupo) {
    if (this.selectedMaterias.some(m => m._id === grupo._id)) {
      Swal.fire({
        icon: 'warning',
        title: 'Materia duplicada',
        text: 'Esta materia ya ha sido añadida.'
      });
      return;
    }

    

    if (this.horariosSeEmpalman(grupo)) {
      Swal.fire({
        icon: 'error',
        title: 'Conflicto de Horario',
        text: 'No se puede añadir esta materia porque se empalma con otra materia seleccionada.'
      });
      return;
    }

    const newSubject = {
      ...grupo,
      alumno: this.userId
    };

    this.selectedMaterias.push(newSubject);
    grupo.cupo -= 1;
  }

  removeSubject(id: string) {
    const materia = this.selectedMaterias.find(m => m._id === id);
    if (materia) {
      const grupo = this.list_grupos.find(g => g._id === id);
      if (grupo) {
        grupo.cupo += 1;
      }
      this.selectedMaterias = this.selectedMaterias.filter(m => m._id !== id);
    }
  }


  
  horariosSeEmpalman(nuevaMateria: Grupo): boolean {
    // Iterar sobre los días de la semana
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const;

    return dias.some(dia => {
        const nuevoHorario = nuevaMateria.horario[dia];
        const horarioExistente = this.selectedMaterias.find(materia => materia.horario[dia]);

        if (nuevoHorario && horarioExistente) {
            const horarioMateria = horarioExistente.horario[dia];

            // Verificar que horarioMateria no sea undefined
            if (horarioMateria) {
                // Comprobar si hay empalme
                return (
                    (nuevoHorario.horaInicio >= horarioMateria.horaInicio && nuevoHorario.horaInicio < horarioMateria.horaFin) ||
                    (nuevoHorario.horaFin > horarioMateria.horaInicio && nuevoHorario.horaFin <= horarioMateria.horaFin) ||
                    (nuevoHorario.horaInicio <= horarioMateria.horaInicio && nuevoHorario.horaFin >= horarioMateria.horaFin)
                );
            }
        }

        return false; // No hay empalme si no hay horario existente o nuevo
    });
}


  
}
