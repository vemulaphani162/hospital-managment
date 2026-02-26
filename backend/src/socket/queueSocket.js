class QueueSocket {
  constructor(io) {
    this.io = io;
    this.doctorQueues = new Map();
  }

  init() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      socket.on('join-doctor-queue', (doctorId) => {
        socket.join(`doctor_${doctorId}`);
        socket.emit('queue-status', this.getDoctorQueue(doctorId));
      });

      socket.on('call-next-patient', async ({ doctorId }) => {
        await this.callNextPatient(doctorId);
        this.broadcastQueueUpdate(doctorId);
      });

      socket.on('complete-patient', async ({ doctorId, queueId }) => {
        await this.completePatient(queueId);
        this.broadcastQueueUpdate(doctorId);
      });

      socket.on('emergency-patient', async ({ doctorId, appointmentId }) => {
        await this.markEmergency(appointmentId);
        this.broadcastQueueUpdate(doctorId);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  }

  async callNextPatient(doctorId) {
    // Implementation for FCFS with emergency priority
  }

  async completePatient(queueId) {
    const query = 'UPDATE patient_queue SET status = $1, completed_at = NOW() WHERE id = $2';
    await pool.query(query, ['completed', queueId]);
  }

  async markEmergency(appointmentId) {
    const query = `
      UPDATE patient_queue 
      SET is_emergency = true, position = 0 
      WHERE appointment_id = $1
    `;
    await pool.query(query, [appointmentId]);
  }

  broadcastQueueUpdate(doctorId) {
    this.io.to(`doctor_${doctorId}`).emit('queue-updated', {
      queue: this.getDoctorQueue(doctorId)
    });
  }

  getDoctorQueue(doctorId) {
    // Fetch current queue from DB
    return [];
  }
}

module.exports = QueueSocket;
