import { Timer } from 'three';

// R3F 9 still expects Clock's start/stop and mutable elapsedTime fields. Keep
// that contract using Timer until the renderer has a compatible native update.
// No deprecated Clock is constructed and no console messages are filtered.
export class FiberTimerClock {
  constructor(autoStart = true) {
    this.timer = new Timer();
    this.autoStart = autoStart;
    this.running = false;
    this.startTime = 0;
    this.oldTime = 0;
    this.elapsedTime = 0;
  }

  start() {
    this.timer.reset();
    this.startTime = performance.now();
    this.oldTime = this.startTime;
    this.elapsedTime = 0;
    this.running = true;
  }

  getDelta() {
    if (this.autoStart && !this.running) {
      this.start();
      return 0;
    }
    if (!this.running) return 0;
    this.timer.update();
    const delta = this.timer.getDelta();
    this.oldTime = performance.now();
    this.elapsedTime += delta;
    return delta;
  }

  getElapsedTime() {
    this.getDelta();
    return this.elapsedTime;
  }

  stop() {
    this.getElapsedTime();
    this.running = false;
    this.autoStart = false;
  }
}
