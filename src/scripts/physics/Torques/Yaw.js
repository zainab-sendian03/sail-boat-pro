import Torque from '../Torque.js';

class Yaw extends Torque {
  // M = Fdrag * d * sin(a)
  constructor() {
    super();
  }

  calculateM(Alpha, F) {
    /**
    Length: 75 meters (246 feet)
    Height: 18.9 meters (62 feet)
    Width: 18.2 meters (60 feet)
    */
    const f = F;

    const d = 75 / 2;

    const alpha = Alpha;

    const M = f * d * Math.sin(alpha);

    return M;
  };

  calculateMInverse(AlphaInverse, F) {
    /**
    Length: 75 meters (246 feet)
    Height: 18.9 meters (62 feet)
    Width: 18.2 meters (60 feet)
    */
    const f = F;

    const d = 75 / 2;

    const alphaInverse = AlphaInverse;

    const MInverse = f * d * Math.sin(alphaInverse);

    return MInverse;
  };

  calculateL() {
    return 10000;
  };

  calculate(alpha, alphaInverse, forceValue) {
    const M = this.calculateM(alpha, forceValue);

    const MInverse = this.calculateM(alphaInverse, forceValue);

    const l = this.calculateL();

    const Theta = (M - MInverse) / l;

    return Theta;
  };
}
export default Yaw;