import { Vector3 } from "three";
import * as dat from "dat.gui";

export class PhysicsWorld {
  constructor(initialPosition) {
    this.position = initialPosition || new Vector3(0, 0, 0);
    this.position = new Vector3(0, 0, 0);
    this.angularVelocity = new Vector3(); // السرعة الزاوية حول المحاور
    this.acceleration = new Vector3();
    this.direction = new Vector3(); // اتجاه حركة القارب
    this.velocity = new Vector3();
    this.movement = new Vector3(); // متجه الحركة
    this.angle = new Vector3(); // الزوايا حول المحاور
    this.windspeedX = 1;
    this.windspeedZ = 1;
    this.windspeed_X = 1;
    this.windspeed_Z = 1;
    this.sailAngle = 0; // زاوية الشراع
    this.waterResistance = 0; // مقاومة الماء
    this.startSimulation = false;
    this.hasCollided = false;

    this.gui = new dat.GUI();
    this.gui
      .add(this, "windspeedX")
      .min(0)
      .max(1000)
      .step(1)
      .name("windspeedX ");
    this.gui
      .add(this, "windspeedZ")
      .min(0)
      .max(1000)
      .step(1)
      .name("windspeedZ ");
    this.gui
      .add(this, "windspeed_X")
      .min(0)
      .max(1000)
      .step(1)
      .name("windspeed-X ");
    this.gui
      .add(this, "windspeed_Z")
      .min(0)
      .max(1000)
      .step(1)
      .name("windspeed-Z ");
    this.gui
      .add(this, "startSimulation")
      .name("start simulation ");

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
      velocity: 10
    };
  }

  calculateWindForceX() {
    let relativeVelocity = this.velocity.clone();
    relativeVelocity.x += this.windspeedX;

    let windForce = 0.5 * this.constants.p_air * this.constants.dragArea * Math.pow(relativeVelocity.x, 2);

    let windForceVector = new Vector3(windForce, 0, 0);

    return windForceVector;
  }

  calculateWindForce_X() {
    let relativeVelocity = this.velocity.clone();
    relativeVelocity.x += this.windspeed_X;

    let windForce = 0.5 * this.constants.p_air * this.constants.dragArea * Math.pow(relativeVelocity.x, 2);

    let windForceVector = new Vector3(-windForce, 0, 0);

    return windForceVector;
  }

  calculateWindForceZ() {
    let relativeVelocity = this.velocity.clone();
    relativeVelocity.z += this.windspeedZ;

    let windForce = 0.5 * this.constants.p_air * this.constants.dragArea * Math.pow(relativeVelocity.z, 2);

    let windForceVector = new Vector3(0, 0, windForce);

    return windForceVector;
  }

  calculateWindForce_Z() {
    let relativeVelocity = this.velocity.clone();
    relativeVelocity.z += this.windspeed_Z;

    let windForce = 0.5 * this.constants.p_air * this.constants.dragArea * Math.pow(relativeVelocity.z, 2);

    let windForceVector = new Vector3(0, 0, -windForce);

    return windForceVector;
  }

  calculate_volume() {
    // volume = s * h
    // s: مساحة الجزء المغمور
    // h: ارتفاع الجزء المغمور
    const volume = this.constants.s_submerged * this.constants.h_submerged;
    return volume;
  }

  calculateBuoyancyForce() {
    var buoyancyForce = this.constants.p_water * this.constants.gravity * this.calculate_volume();
    var buoyancyForceVector = new Vector3(0, buoyancyForce, 0);
    return buoyancyForceVector;
  }

  calculateWeightOfBoat() {
    var massOfBoat = this.constants.mass;
    var weightOfBoat = massOfBoat * this.constants.gravity;
    var weightVector = new Vector3(0, -weightOfBoat, 0);
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

  update(deltaTime) {
    if (this.startSimulation) {
      this.calculate_acceleration();
      this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
      this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
  
  
      if (this.position.y <= 0) {
        this.velocity.y *= -0.5;
        this.position.y = 10; 
        this.acceleration.y = 0; 
        this.hasCollided = true; 
        const endMessage = document.getElementById("endMessage");
        if (endMessage) {
          endMessage.style.display = "block";
        }
      }
      console.log("Position", this.position);
    }
  }
}

export default PhysicsWorld;
