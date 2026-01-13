import React, { CSSProperties, useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';

import linearMap from '../helpers/linear-map';
import { debounce } from 'lodash-es';

/**
 * Graph node data type
 */
export type GraphNode = [string, number];

/**
 * Graph edge data type
 */
export type GraphEdge = [string, string, number];

/**
 * Graph raw data type
 */
export interface GraphRawData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * ECharts node type
 */
export interface EChartsNode {
  id: string;
  name: string;
  value: number;
  symbolSize: number;
  symbol: string;
  label: {
    show: boolean;
  };
}

/**
 * ECharts edge type
 */
export interface EChartsEdge {
  source: string;
  target: string;
  value: number;
}

/**
 * ECharts data type
 */
export interface EChartsData {
  nodes: EChartsNode[];
  edges: EChartsEdge[];
}

/**
 * Graph component props
 */
export interface GraphProps {
  /**
   * Raw graph data
   */
  readonly data: GraphRawData;
  /**
   * Style for graph container
   */
  readonly style?: CSSProperties;
  /**
   * ID of the focused node
   */
  readonly focusedNodeID?: string;
}

/**
 * Node size range [min, max] in pixels
 */
const NODE_SIZE_RANGE = [10, 25];

/**
 * Generate ECharts nodes from raw graph nodes
 * @param nodes Raw graph nodes
 * @param focusedNodeID ID of the focused node
 * @returns ECharts nodes
 */
const generateEChartsNodes = (nodes: GraphNode[], focusedNodeID?: string): EChartsNode[] => {
  if (!nodes || nodes.length === 0) {
    return [];
  }

  const values: number[] = nodes.map((node) => node[1]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = [minValue, maxValue] as [number, number];

  return nodes.map((node) => {
    const [id, value] = node;
    const avatarId = id.split('/')[0];

    return {
      id,
      name: id,
      value,
      symbolSize: linearMap(value, valueRange, NODE_SIZE_RANGE),
      symbol: `image://https://avatars.githubusercontent.com/${avatarId}`,
      label: {
        show: id === focusedNodeID,
      },
    };
  });
};

/**
 * Generate ECharts edges from raw graph edges
 * @param edges Raw graph edges
 * @returns ECharts edges
 */
const generateEChartsEdges = (edges: GraphEdge[]): EChartsEdge[] => {
  if (!edges || edges.length === 0) {
    return [];
  }

  // Determine threshold based on ID format
  const firstEdge = edges[0];
  const threshold = firstEdge[0].split('/').length === 2 ? 5 : 2.5;

  return edges
    .map((edge) => {
      const [source, target, value] = edge;
      return {
        source,
        target,
        value,
      };
    })
    .filter((edge) => edge.value > threshold); // Filter out weak edges for better graph readability
};

/**
 * Generate ECharts data from raw graph data
 * @param data Raw graph data
 * @param focusedNodeID ID of the focused node
 * @returns ECharts data
 */
const generateEChartsData = (data: GraphRawData, focusedNodeID?: string): EChartsData => {
  return {
    nodes: generateEChartsNodes(data.nodes, focusedNodeID),
    edges: generateEChartsEdges(data.edges),
  };
};

/**
 * Handle node click event
 * @param params Click event parameters
 */
const handleNodeClick = (params: echarts.ECElementEvent): void => {
  if (!params.data || !params.data.id) return;

  const id = params.data.id;
  let baseUrl = 'https://github.com/';

  // Handle different platforms
  if (id.includes('gitee.com/')) {
    baseUrl = 'https://';
  }

  const url = baseUrl + id;
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Graph component for visualizing network graphs
 */
const Graph: React.FC<GraphProps> = ({ data, style = {}, focusedNodeID }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  // Generate ECharts data from raw data
  const graphData = useMemo(() => generateEChartsData(data, focusedNodeID), [data, focusedNodeID]);

  // Check if graph has any data
  const hasData = graphData.nodes.length > 0 || graphData.edges.length > 0;

  // ECharts option configuration
  const option = useMemo(
    () => ({
      tooltip: {
        formatter: (params: any) => {
          if (!params.data) return '';

          const { name, value } = params.data;
          return `${name}: ${value}`;
        },
      },
      animation: true,
      animationDuration: 2000,
      series: [
        {
          type: 'graph',
          layout: 'force',
          nodes: graphData.nodes,
          edges: graphData.edges,
          // Enable mouse zooming and translating
          roam: true,
          label: {
            position: 'right',
            formatter: '{b}',
            fontSize: 10,
          },
          force: {
            initLayout: 'circular',
            gravity: 0.1,
            repulsion: 80,
            edgeLength: [50, 100],
            // Disable the iteration animation of layout
            layoutAnimation: false,
          },
          lineStyle: {
            curveness: 0.3,
            opacity: 0.2,
            width: 1,
          },
          emphasis: {
            focus: 'adjacency',
            label: {
              position: 'right',
              show: true,
              fontSize: 12,
              fontWeight: 'bold',
            },
            lineStyle: {
              opacity: 0.6,
              width: 2,
            },
          },
        },
      ],
    }),
    [graphData]
  );

  // Initialize and dispose ECharts instance
  useEffect(() => {
    const chartDOM = divRef.current;
    if (!chartDOM) return;

    try {
      // Initialize chart instance
      const instance = echarts.init(chartDOM);
      chartRef.current = instance;

      return () => {
        // Cleanup
        instance.dispose();
        chartRef.current = null;
      };
    } catch (error) {
      console.error('Failed to initialize ECharts instance:', error);
    }
  }, []);

  // Update chart when option changes
  useEffect(() => {
    const instance = chartRef.current;
    if (!instance) return;

    try {
      instance.setOption(option, true);

      // Add click event listener
      instance.on('click', handleNodeClick);

      // Add resize listener with debounce
      const debouncedResize = debounce(() => {
        instance.resize();
      }, 500);

      window.addEventListener('resize', debouncedResize);

      // Cleanup event listeners
      return () => {
        instance.off('click', handleNodeClick);
        window.removeEventListener('resize', debouncedResize);
      };
    } catch (error) {
      console.error('Failed to update ECharts option:', error);
    }
  }, [option]);

  return (
    <div className="hypertrons-crx-border">
      {hasData ? (
        <div ref={divRef} style={style}></div>
      ) : (
        <div
          style={{
            ...style,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#666',
            fontSize: '14px',
          }}
        >
          No graph data available
        </div>
      )}
    </div>
  );
};

export default Graph;
