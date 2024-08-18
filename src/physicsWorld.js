import { Vector3, Mesh } from "three";
import * as dat from "dat.gui";

export class PhysicsWorld {
  constructor(initialPosition, boatMesh, sailMesh) {
    this.position = initialPosition || new Vector3(0, 0, 0);
    this.boatMesh = boatMesh; // The boat mesh
    this.sailMesh = sailMesh; // The sail mesh

    this.acceleration = new Vector3();
    this.velocity = new Vector3();
    this.angularVelocity = new Vector3();
    this.angularAcceleration = new Vector3();
    this.rotationAngle = new Vector3();
    this.windspeedX = 1;
    this.windspeedZ = 1;
    this.windspeed_X = 1;
    this.windspeed_Z = 1;
    this.sailAngle = 0;
    this.momentOfInertiaY = 1;
    this.startSimulation = false;
    this.hasCollided = false;

    this.gui = new dat.GUI();
    this.gui.add(this, "windspeedX").min(0).max(1000).step(1).name("windspeedX ");
    this.gui.add(this, "windspeedZ").min(0).max(1000).step(1).name("windspeedZ ");
    this.gui.add(this, "windspeed_X").min(0).max(1000).step(1).name("windspeed-X ");
    this.gui.add(this, "windspeed_Z").min(0).max(1000).step(1).name("windspeed-Z ");
    this.gui.add(this, "sailAngle").min(-180).max(180).step(1).name("sail angle");
    this.gui.add(this, "momentOfInertiaY").min(0).max(180).step(1).name("moment Of Inertia");
    this.gui.add(this, "startSimulation").name("start simulation ");

    this.constants = {
      gravity: 9.8,
      cd: 0.08,
      mass: 200,
      p_water: 1000,
      p_air: 1.2,
      h_submerged: 0.1,
      s_sail: 50,
      s_submerged: 2,
      dragArea: 0.1,
      velocity: 10,
    };
  }

  calculateWindForceX() {
    let relativeVelocity = this.velocity.clone();
    relativeVelocity.x += this.windspeedX;

    let windForce = 0.5 * this.constants.p_air * this.constants.s_sail * Math.pow(relativeVelocity.x, 2) * this.constants.cd;

    let windForceVector = new Vector3(windForce, 0, 0);

    return windForceVector;
  }

  calculateWindForceZ() {
    let relativeVelocity = this.velocity.clone();
    relativeVelocity.z += this.windspeedZ;

    let windForce = 0.5 * this.constants.p_air * this.constants.s_sail * Math.pow(relativeVelocity.z, 2) * this.constants.cd;

    let windForceVector = new Vector3(0, 0, windForce);

    return windForceVector;
  }
  
  calculateWindForce_X() {
    let relativeVelocity = this.velocity.clone();
    relativeVelocity.x += this.windspeed_X;

    let windForce = 0.5 * this.constants.p_air * this.constants.s_sail * Math.pow(relativeVelocity.x, 2) * this.constants.cd;

    let windForceVector = new Vector3(-windForce, 0, 0);

    return windForceVector;
  }

  calculateWindForce_Z() {
    let relativeVelocity = this.velocity.clone();
    relativeVelocity.z += this.windspeed_Z;

    let windForce = 0.5 * this.constants.p_air * this.constants.s_sail * Math.pow(relativeVelocity.z, 2) * this.constants.cd;

    let windForceVector = new Vector3(0, 0, -windForce);

    return windForceVector;
  }

  calculateThrustForce() {
    let windSpeedX = this.windspeedX * Math.cos((this.sailAngle * Math.PI) / 180);
    let windSpeedZ = this.windspeedZ * Math.sin((this.sailAngle * Math.PI) / 180);

    let sailAngleRad = (this.sailAngle * Math.PI) / 180;
    let windSpeed = Math.sqrt(Math.pow(windSpeedX, 2) + Math.pow(windSpeedZ, 2));

    let thrustMagnitude = 0.5 * this.constants.p_air * this.constants.s_sail * Math.pow(windSpeed, 2);

    let thrustForceVector = new Vector3(
      thrustMagnitude * Math.cos(sailAngleRad),
      0,
      thrustMagnitude * Math.sin(sailAngleRad)
    );

    return thrustForceVector;
  }

  calculate_volume() {
    // volume = s * h
    // s: submerged area
    // h: submerged height
    const volume = this.constants.s_submerged * this.constants.h_submerged;
    return volume;
  }

  calculateBuoyancyForce() {
    let buoyancyForce = this.constants.p_water * this.constants.gravity * this.calculate_volume();
    let buoyancyForceVector = new Vector3(0, buoyancyForce, 0);
    return buoyancyForceVector;
  }

  calculateWeightOfBoat() {
    let weightOfBoat = this.constants.mass * this.constants.gravity;
    let weightVector = new Vector3(0, -weightOfBoat, 0);
    return weightVector;
  }

  calculateDragForce() {
    let relativeVelocity = this.velocity.clone();
    let dragForce = 0.5 * this.constants.p_water * this.constants.dragArea * Math.pow(relativeVelocity.length(), 2) * this.constants.cd;

    let dragForceVector = relativeVelocity.clone().normalize().multiplyScalar(-dragForce);

    return dragForceVector;
  }

  calculate_sigma() {
    // Sigma = Sum Of Forces
    var sigma = new Vector3(0, 0, 0);
    sigma = sigma.add(this.calculateWindForceX());
    sigma = sigma.add(this.calculateWindForceZ());
    sigma = sigma.add(this.calculateWindForce_X());
    sigma = sigma.add(this.calculateWindForce_Z());

    sigma = sigma.add(this.calculateBuoyancyForce());

    sigma = sigma.add(this.calculateWeightOfBoat());
    sigma = sigma.add(this.calculateDragForce());

    // Add the thrust force if the sail is present
    if (this.sailAngle !== 0) {
      sigma = sigma.add(this.calculateThrustForce());
    }

    return sigma;
  }

  calculate_acceleration() {
    // a = sigma / m
    const sigma = this.calculate_sigma();
    const m = this.constants.mass;
    const a = sigma.divideScalar(m);
    this.acceleration = a.clone();
    return a;
  }

  calculateSailPosition() {
    const sailAngleRad = (this.sailAngle * Math.PI) / 180;
    const sailX = 50 * Math.cos(sailAngleRad);
    const sailZ = 50 * Math.sin(sailAngleRad);
    return new Vector3(sailX, 100, sailZ);
  }

  calculateTorqueY() {
    const sailPosition = this.calculateSailPosition();
    const windForceX = this.calculateWindForceX().x + this.calculateWindForce_X().x;
    const windForceZ = this.calculateWindForceZ().z + this.calculateWindForce_Z().z;
  
    const torqueY = sailPosition.z * windForceX - sailPosition.x * windForceZ;
    return torqueY;
  }

  calculateAngularAcceleration() {
    const torqueY = this.calculateTorqueY();
    const angularAcceleration = torqueY / this.momentOfInertiaY;

    const maxAngularAcceleration = 0.05;
    const minAngularAcceleration = 0.01;

    if (Math.abs(angularAcceleration) < minAngularAcceleration) {
      this.angularAcceleration.set(0, 0, 0);
    } else {
      this.angularAcceleration.set(0, Math.min(Math.max(angularAcceleration, -maxAngularAcceleration), maxAngularAcceleration), 0);
    }
    return this.angularAcceleration;
  }

  update(deltaTime) {
    if (this.startSimulation) {
      this.calculate_acceleration();
      this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
      this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

      this.calculateAngularAcceleration();
      this.angularVelocity.add(this.angularAcceleration.clone().multiplyScalar(deltaTime));
      this.rotationAngle.y += this.angularVelocity.y * deltaTime;
      this.rotationAngle.y = ((this.rotationAngle.y % 360) + 360) % 360;

      const maxRotationAngle = 45;
      const maxRotationAngleRad = (maxRotationAngle * Math.PI) / 180;
      if (Math.abs(this.rotationAngle.y) >= maxRotationAngleRad) {
        this.angularVelocity.set(0, 0, 0);
        this.angularAcceleration.set(0, 0, 0);
        this.rotationAngle.y = maxRotationAngleRad * Math.sign(this.rotationAngle.y);
      }
      this.updateMeshes
      
    }
  }

  updateMeshes() {
    // Update boat mesh position and rotation
    this.boatMesh.position.copy(this.position);
    this.boatMesh.rotation.set(this.rotationAngle.x, this.rotationAngle.y, this.rotationAngle.z);

    // Update sail mesh rotation based on sail angle
    const sailAngleRad = (this.sailAngle * Math.PI) / 180;
    this.sailMesh.rotation.set(0, sailAngleRad, 0);
  }
}
