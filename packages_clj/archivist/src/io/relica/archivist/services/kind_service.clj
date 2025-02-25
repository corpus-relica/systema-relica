(ns io.relica.archivist.services.kind-service
  (:require [mount.core :refer [defstate]]
            [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]
            [io.relica.archivist.db.queries :as queries]
            [io.relica.archivist.services.cache-service :as cache]
            [io.relica.archivist.services.graph-service :as graph]
            )
  (:import (java.net URI))
  (:gen-class))

(defn serialize-record [record]
  (reduce-kv (fn [m k v]
               (assoc m k
                     (cond
                       (instance? java.time.LocalDate v) (.toString v)
                       :else v)))
             {}
             record))

(defprotocol KindServiceOperations
  (get-list [this conf]))

(defrecord KindServiceComponent [graph-service cache-service]
  KindServiceOperations

  ;;   const result = await this.graphService.execQuery(getListOfKindsQuery, {
  ;;     sortField,
  ;;     sortOrder,
  ;;     skip: neo4j.int(skip),
  ;;     pageSize: neo4j.int(pageSize),
  ;;   });

  ;;   const total = await this.graphService.execQuery(countKindsQuery, {});

  ;;   const transformedResult = result.map((item) => {
  ;;     const t: any = this.graphService.transformResult(item);
  ;;     t.id = t.fact_uid;
  ;;     return t;
  ;;   });

  ;;   //convert neo4j integer to js number
  ;;   console.log();

  ;;   return {
  ;;     data: transformedResult,
  ;;     total: total[0].get('total').toInt(),
  ;;   };
  ;;
  (get-list [this conf]
    (tap> "get list conf")
    (tap> conf)
    (try
      (let [resolved-conf {:sortField (first (:sort conf))
                           :sortOrder (second (:sort conf))
                           :skip (first (:range conf))
                           :pageSize (second (:range conf))}
            _ (tap> resolved-conf)
            raw-result (graph/exec-query
                        graph-service
                        queries/get-lists-of-kinds  ; Use the predefined query
                        resolved-conf)
            _ (tap> raw-result)
            result (map (fn [record]
                          (serialize-record (:r record)))
                        raw-result)
            ]
        (tap> {:event :get-kinds-list-result
               :result result})
        result)
      (catch Exception e
        (tap> {:event :get-kinds-list-error
               :error e})
        nil)))
  )

(defn create-gellish-base-service-component [graph-service cache-service]
  (->KindServiceComponent graph-service cache-service))

(defonce ks-comp (atom nil))

(defn start [graph-service cache-service]
  (println "Starting Gellish Base Service...")
  (let [service (create-gellish-base-service-component graph-service cache-service)]
    (reset! ks-comp service)
    service))

(defn stop []
  (println "Stopping Gellish Base Service..."))

(comment
  ;; (def neo4j-instance io.relica.archivist.components/neo4j-conn)

  ;; neo4j-instance

  ;; (neo4j/execute-query neo4j-instance "foobar" {:foo "bar"})

  ;; (def service (start neo4j-instance))

  @ks-comp

  (io.relica.archivist.kind-service/get-list @ks-comp {
      :sortField "lh_object_name"
      :sortOrder "ASC"
      :skip 0
      :pageSize 10
    })

  ;; (someshit service)

  ;; (stop)

  )

  ;; constructor(private readonly graphService: GraphService) {}

  ;; async getList(
  ;;   sortField: string,
  ;;   sortOrder: string,
  ;;   skip: number,
  ;;   pageSize: number,
  ;; ) {
  ;;   const result = await this.graphService.execQuery(getListOfKindsQuery, {
  ;;     sortField,
  ;;     sortOrder,
  ;;     skip: neo4j.int(skip),
  ;;     pageSize: neo4j.int(pageSize),
  ;;   });

  ;;   const total = await this.graphService.execQuery(countKindsQuery, {});

  ;;   const transformedResult = result.map((item) => {
  ;;     const t: any = this.graphService.transformResult(item);
  ;;     t.id = t.fact_uid;
  ;;     return t;
  ;;   });

  ;;   //convert neo4j integer to js number
  ;;   console.log();

  ;;   return {
  ;;     data: transformedResult,
  ;;     total: total[0].get('total').toInt(),
  ;;   };
  ;; }

  ;; async getOne(id: number) {
  ;;   return {};
  ;; }

  ;; async getMany(data: any) {}

  ;; async getManyReference(data: any) {}

  ;; async create(data: any) {}

  ;; async update(id: number, data: any) {}

  ;; async updateMany(data: any) {}

  ;; async delete(id: number) {}

  ;; async deleteMany(data: any) {}
