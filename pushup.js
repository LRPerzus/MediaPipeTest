// ====== Smoothing Utilities ======

// Exponential Moving Average (like your EMA class)
class EMA {
  constructor(alpha = 0.35) {
    this.alpha = alpha;
    this.value = null;
  }

  update(x) {
    if (this.value === null) this.value = x;
    else this.value = this.alpha * this.value + (1 - this.alpha) * x;
    return this.value;
  }
}

// Sliding window for min/max range tracking (like MovingMinMax)
class MovingMinMax {
  constructor(size = 10) {
    this.size = size;
    this.values = [];
  }

  update(val) {
    this.values.push(val);
    if (this.values.length > this.size) this.values.shift();
    const mn = Math.min(...this.values);
    const mx = Math.max(...this.values);
    return [mn, mx];
  }
}

// ====== Pushup Counter ======

class PushupCounter {
  constructor(down_angle = 75, up_angle = 160, hip_tol = 22) {
    this.down_angle = down_angle;
    this.up_angle = up_angle;
    this.hip_tol = hip_tol;
    this.count = 0;
    this.stage = "up"; // "up" -> going down, "down" -> coming up
    this.elbowSmooth = new EMA(0.35);
    this.rangeTrack = new MovingMinMax(10);
  }

  update(metrics) {
    if (!metrics || !metrics.visibility_ok) {
      return [this.count, "Make sure full body is visible"];
    }

    const elbow = this.elbowSmooth.update(metrics.elbow_angle);
    const [mn, mx] = this.rangeTrack.update(elbow);

    // gate on back straightness
    if (Math.abs(180 - metrics.hip_angle) > this.hip_tol) {
      return [this.count, "Straighten your body (hips)."];
    }

    let tip = null;

    if (elbow < this.down_angle && this.stage === "up") {
      this.stage = "down";
      tip = "Depth reached ✓";
    }

    if (elbow > this.up_angle && this.stage === "down") {
      this.stage = "up";
      this.count += 1;
      tip = "Lockout ✓";
    }

    if (mx - mn < 25) {
      tip = tip || "Increase range of motion.";
    }

    return [this.count, tip || "Good"];
  }
}
