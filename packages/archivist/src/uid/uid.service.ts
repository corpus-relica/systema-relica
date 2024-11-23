import { Injectable } from '@nestjs/common';

import neo4j from 'neo4j-driver';
import { highestUID } from 'src/graph/queries';
import { GraphService } from 'src/graph/graph.service';

@Injectable()
export class UIDService {
  highestValue = neo4j.int('1000000000'); // Set to minThreshold initially

  constructor(private readonly graphService: GraphService) {}

  init = async () => {
    const minThreshold = 1000000000; //neo4j.int("1000000000");
    const maxThreshold = 2000000000; //neo4j.int("2000000000");

    const result = await this.graphService.execQuery(highestUID, {
      minThreshold,
      maxThreshold,
    });

    // If a higher value exists in the database, use it
    if (result[0] && result[0].get('highestValue')) {
      this.highestValue = neo4j.int(result[0].get('highestValue'));
      this.highestValue = this.highestValue.add(1);
    }

    console.log(
      '//// init UID Service; current highest value: ',
      this.highestValue.toInt(),
    );
    return this.highestValue.toInt();
  };

  reserveUID = (n = 1) => {
    let reservedUIDs = [];

    try {
      for (let i = 0; i < n; i++) {
        this.highestValue = this.highestValue.add(1);
        console.log('//// reserve UID: ', this.highestValue.toString());
        reservedUIDs.push(this.highestValue.toInt());
      }
    } catch (error) {
      console.error('An error occurred while reserving UIDs: ', error);
    }

    return reservedUIDs;
  };
}
