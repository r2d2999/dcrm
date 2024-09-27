import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { MateriasService } from '../materias.service';
import { MatSelectModule } from '@angular/material/select';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { RegisterUserService } from '../../auth/register-user.service';
import { GroupService } from '../group.service';
import { SessionService } from '../../auth/session.service';
import { FormsModule } from '@angular/forms'; // Importa FormsModule aquí
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { ScheduleComponent } from '../../shared/schedule/schedule.component';


interface Materia {
  _id: string;
  nombre: string;
  codigo: string;
  creditos: number;
  cupos: number;
  horario: {
    Lunes?: {
      horaInicio: string;
      horaFin: string;
    };
    Martes?: {
      horaInicio: string;
      horaFin: string;
    };
    Miércoles?: {
      horaInicio: string;
      horaFin: string;
    };
    Jueves?: {
      horaInicio: string;
      horaFin: string;
    };
    Viernes?: {
      horaInicio: string;
      horaFin: string;
    };
    [key: string]: { // Añadir firma de índice
      horaInicio: string;
      horaFin: string;
    } | undefined; 
  };
  profesores: {
    profesor1: string;
    profesor2: string;
  };
  status: boolean;
  disponibilidad?: any;
}


interface User {
  id: number;
  name: string;
  _id: any;
}

export interface Group {
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
  selector: 'app-subjects',
  standalone: true,
  imports: [
    NavbarComponent,
    CommonModule,
    MatSelectModule, FormsModule, MatDialogModule
  ],
  templateUrl: './subjects.component.html',
  styleUrls: ['./subjects.component.scss']
})
export class SubjectsComponent implements OnInit {
  public materias: Materia[] = [];
  public materiasSeleccionadas: Materia[] = [];
  public materiasDisponibles: Materia[] = [];
  public selectedMateriaId: string = '';
  public selectedMateriaIdToRemove: string = '';
  public user: User | null = null;

  public userName: any;
  public userId: any;

  constructor(private service: MateriasService, private router: Router, private userService: RegisterUserService,
              private groupService: GroupService, private sService: SessionService, private dialog: MatDialog) {}

  ngOnInit(): void {
    //this.sService.resetTimer();

    this.loadUser();
    this.loadMaterias();
  }


  vistaPre(): void {
    const profesor = {
      name: this.userName,
    };
  
    this.dialog.open(ScheduleComponent, {
      data: {
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
        materias: this.materiasSeleccionadas,
        tipo: 'profesor'
      },
      width: '100%', // Ajusta el ancho como necesites (puedes usar '600px', '80%', etc.)
      height: 'auto', // Ajusta la altura si es necesario
      maxWidth: '800px', // Máximo ancho del modal
    });
  }
  

  getHorario(materia: Materia): string {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const horarios = dias.map(dia => {
      const horario = materia.horario[dia];
      return horario ? `${dia.charAt(0)}: ${horario.horaInicio} - ${horario.horaFin}` : null;
    }).filter(Boolean);
    
    return horarios.join(', ');
  }
  
  
  

  loadUser() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userName = this.user?.name;
    if (this.user) {
      this.userId = this.user._id;
      console.log("USERS:", this.user);
    }
  }

  loadMaterias() {
    this.service.getMaterias().subscribe({
      next: (data) => {
        console.log("Datos recibidos:", data); // Muestra los datos recibidos del servicio
  
        this.materias = data.map((materia: any) => {
          const profesor1 = materia.profesores.profesor1;
          const profesor2 = materia.profesores.profesor2;
          const disponibilidad = (profesor1 === 'no' || profesor2 === 'no');
          
          const materiaConStatus = { 
            ...materia, 
            status: disponibilidad // true si está disponible, false si no
          };
  
          console.log("Materia procesada:", materiaConStatus); // Muestra cada materia procesada
          return materiaConStatus;
        });
  
        console.log("Materias después del mapeo:", this.materias); // Muestra todas las materias después de ser mapeadas
        this.updateDisponibles();
      },
      error: (error) => {
        console.error("Error al cargar las materias", error);
      }
    });
  }
  
  
  
  async updateAllInfo() {
    try {
      await this.updateP2();
      //await this.updateProfessor();
      await this.finalizar();
      await this.finalize();
    } catch (error) {
      console.error('Error durante la actualización:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al realizar la actualización. Intenta nuevamente.'
      });
    }
  }


updateP2(): Promise<void> {

  return new Promise((resolve, reject) => {
    const nuevoProfesor = this.user?.name; // Asegúrate de que no sea undefined
    const materiaIds = this.materiasSeleccionadas.map(m => m._id); 

    console.log('Nuevo profesor:', nuevoProfesor);
    console.log('IDs de materias:', materiaIds);

    if (!nuevoProfesor) {
      console.error("El nombre del profesor es indefinido.");
      return reject(new Error("El nombre del profesor es indefinido.")); // Rechaza la promesa
    }

    const updatePromises = materiaIds.map(id => {
      return this.service.updateProfesorOnSubject(id, nuevoProfesor).toPromise();
    });

    Promise.all(updatePromises)
      .then(responses => {
        console.log("Materias actualizadas con éxito:", responses);
        resolve(); // Resuelve la promesa
      })
      .catch(error => {
        console.error("Error al actualizar las materias:", error);
        reject(error); // Rechaza la promesa en caso de error
      });
  });
}

  


  //actualiza el valor de profesor en las mateiras
  updateProfessor(): Promise<void> {
    return new Promise((resolve, reject) => {
      const nuevoProfesor = this.user?.name || 'no'; 
      const materiaIds = this.materiasSeleccionadas.map(m => m._id); 
  
      console.log('Nuevo profesor:', nuevoProfesor);
      console.log('IDs de materias:', materiaIds);
  
      if (materiaIds.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Selecciona una o más materias',
          text: 'Por favor, selecciona al menos una materia para actualizar el profesor.'
        });
        return resolve(); // Resolvemos para evitar que la promesa se quede pendiente
      }
  
      const updatePromises = materiaIds.map(materiaId => {
        const materia = this.materias.find(m => m._id === materiaId);
        if (materia) {
          if (materia.profesores.profesor1 === 'no') {
            materia.profesores.profesor1 = nuevoProfesor;
          } else if (materia.profesores.profesor2 === 'no') {
            materia.profesores.profesor2 = nuevoProfesor;
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: `La materia ${materia.nombre} ya tiene dos profesores asignados.`
            });
            return Promise.resolve(null);
          }

          console.log("el nuevo valor es: ", nuevoProfesor);
  
          return this.service.updateProfesorOnSubject(materiaId, nuevoProfesor).toPromise();
        }
        return Promise.resolve(null);
      });
  
      Promise.all(updatePromises)
        .then(responses => {
          const successfulUpdates = responses.filter(response => response !== null);
          if (successfulUpdates.length > 0) {
            Swal.fire({
              icon: 'success',
              title: 'Profesores actualizados',
              text: `Se han asignado profesores a las materias seleccionadas.`
            });
            this.loadMaterias();
          } else {
            Swal.fire({
              icon: 'warning',
              title: 'Sin cambios',
              text: 'No se realizaron actualizaciones. Asegúrate de que las materias tengan espacio para nuevos profesores.'
            });
          }
          resolve(); // Resolvemos la promesa
        })
        .catch(error => {
          console.error('Error al actualizar los profesores:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron actualizar los profesores. Intenta nuevamente.'
          });
          reject(error); // Rechazamos la promesa en caso de error
        });
    });
  }
  
  
  horariosSeEmpalman(nuevaMateria: Materia): boolean {
    // Iterar sobre los días de la semana
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const;

    return dias.some(dia => {
        const nuevoHorario = nuevaMateria.horario[dia];
        const horarioExistente = this.materiasSeleccionadas.find(materia => materia.horario[dia]);

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

  //Sube los grupos
  finalizar(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (this.materiasSeleccionadas.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No hay materias seleccionadas',
                text: 'Por favor, selecciona al menos una materia para finalizar.'
            });
            return resolve();
        }

        const groupPromises = this.materiasSeleccionadas.map(materia => {
            const newGroup = {
                name: `${materia.nombre}-A`,
                profesor: this.userId,
                cupo: 3,
                materia: materia.nombre,
                horario: {
                    Lunes: {
                        horaInicio: materia.horario?.Lunes?.horaInicio || '',
                        horaFin: materia.horario?.Lunes?.horaFin || ''
                    },
                    Martes: {
                        horaInicio: materia.horario?.Martes?.horaInicio || '',
                        horaFin: materia.horario?.Martes?.horaFin || ''
                    },
                    Miércoles: {
                        horaInicio: materia.horario?.Miércoles?.horaInicio || '',
                        horaFin: materia.horario?.Miércoles?.horaFin || ''
                    },
                    Jueves: {
                        horaInicio: materia.horario?.Jueves?.horaInicio || '',
                        horaFin: materia.horario?.Jueves?.horaFin || ''
                    },
                    Viernes: {
                        horaInicio: materia.horario?.Viernes?.horaInicio || '',
                        horaFin: materia.horario?.Viernes?.horaFin || ''
                    }
                }
            };

            console.log('Datos del grupo a crear:', newGroup); // Aquí es donde agregas el console.log

            return this.groupService.createGroup(newGroup).toPromise();
        });

        Promise.all(groupPromises)
            .then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Grupos creados',
                    text: 'Los grupos se han creado exitosamente.'
                });
                resolve();
            })
            .catch(error => {
                console.error('Error al crear grupos:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron crear los grupos. Intenta nuevamente.'
                });
                reject(error);
            });
    });
}



  
  addSubject(id: string) {
    const materia = this.materias.find(m => m._id === id && m.status);
    if (materia && !this.materiasSeleccionadas.some(m => m._id === id)) {
      
      // Verifica si la materia tiene dos profesores asignados
      if (materia.profesores.profesor1 !== 'no' && materia.profesores.profesor2 !== 'no') {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se puede agregar más de 2 profesores por materia.'
        });
        return;
      }
  
      // Verifica si hay un conflicto de horarios
      if (this.horariosSeEmpalman(materia)) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se puede agregar esa materia porque se empalma con otra materia.'
        });
        return;
      }
  
      // Asignar el usuario como profesor solo si hay espacio
      const nuevaMateria: Materia = { ...materia };
      if (nuevaMateria.profesores.profesor1 === 'no') {
        nuevaMateria.profesores.profesor1 = this.user?.name || 'no';
      } else if (nuevaMateria.profesores.profesor2 === 'no') {
        nuevaMateria.profesores.profesor2 = this.user?.name || 'no';
      }
  
      // Agregar la materia seleccionada
      this.materiasSeleccionadas.push(nuevaMateria);
      this.updateStatus(id, false); // Cambiar el status a false
      this.updateDisponibles(); // Actualizar disponibles
      this.selectedMateriaId = ''; // Resetear la selección
    }
  }
  

  removeSubject(id: string) {
    const materia = this.materiasSeleccionadas.find(m => m._id === id);
    if (materia) {
      // Eliminar la materia seleccionada
      this.materiasSeleccionadas = this.materiasSeleccionadas.filter(m => m._id !== id);
      
      const originalMateria = this.materias.find(m => m._id === id);
      if (originalMateria) {
        // Limpiar el profesor en la materia original
        if (materia.profesores.profesor1 === this.userName) {
          originalMateria.profesores.profesor1 = 'no'; // Resetear profesor1
        }
        if (materia.profesores.profesor2 === this.userName) {
          originalMateria.profesores.profesor2 = 'no'; // Resetear profesor2
        }
  
        // También puedes limpiar el status de la materia si es necesario
        originalMateria.status = true; // Resetear status
      }
  
      this.updateStatus(id, true); // Cambiar el status a true
    }
  }
  

  updateStatus(id: string, status: boolean) {
    const materia = this.materias.find(m => m._id === id);
    if (materia) {
      materia.status = status;
      this.updateDisponibles(); // Actualizar materias disponibles
    }
  }

  updateDisponibles() {
    this.materiasDisponibles = this.materias.filter(m => m.status);
  }

  updateSchedule() {
    this.userService.updateHorario(this.userId, true).subscribe({
      next: (data) => {
        Swal.fire({
          icon: 'success',
          title: 'Carga Finalizada',
          text: 'Carga finalizada con éxito'
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/home']);
          }
        });
      },
      error: (error) => {
        console.error("Error al actualizar el usuario", error);
      }
    });
  }


  //Sube horario
  finalize(): Promise<void> {
    console.log("Materias seleccionadas:", this.materiasSeleccionadas);
  
    return new Promise((resolve) => {
      Swal.fire({
        icon: 'warning',
        title: 'Finalizar Carga',
        text: '¿Está seguro de querer terminar su carga de horario laboral?',
        showCancelButton: true,
        cancelButtonColor: 'red',
        confirmButtonText: 'Terminar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.updateSchedule(); // Esta función también debería devolver una promesa
          resolve();
        } else {
          resolve(); // Resolvemos si no se confirma
        }
      });
    });
  }
  


}
