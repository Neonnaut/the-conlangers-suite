class Chance_Mapper {
   chances: {
      id: number;
      percent: number;
      rolled: boolean | null;
   }[] = [];
   check_parsing: boolean;

   constructor() {
      this.chances = [
         {
            id: 1,
            percent: 50,
            rolled: null,
         },
      ];
      this.check_parsing = false;
   }

   add_chance(percent: number) {
      const p = Math.max(0, Math.min(100, percent));
      this.chances.push({
         id: this.chances.length + 1,
         percent: p,
         rolled: null,
      });
   }

   get_is_success(id: number): boolean | null {
      const chance = this.chances.find((c) => c.id === id);
      return chance ? chance.rolled : null;
   }

   reset() {
      for (const c of this.chances) {
         c.rolled = null;
      }
   }

   roll_all() {
      const results = {};
      for (const c of this.chances) {
         const roll = Math.random() * 100;
         c.rolled = roll < c.percent;
      }
      return results;
   }

   get_last_chance() {
      if (this.check_parsing && this.chances.length > 0) {
         return this.chances[this.chances.length - 1].id;
      } else {
         return null;
      }
   }
}

export default Chance_Mapper;
