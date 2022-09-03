import Graph from "./Graph";
import ForceGraph3D, {ForceGraph3DInstance} from "3d-force-graph";
import Node from "./Node";
import Link from "./Link";
import ObsidianTheme from "../views/ObsidianTheme";
import {GraphSettings} from "../settings/GraphSettings";
import State from "../util/State";

// Adapted from https://github.com/vasturiano/3d-force-graph/blob/master/example/highlight/index.html

export class ForceGraph {

	private readonly instance: ForceGraph3DInstance;
	private readonly rootHtmlElement: HTMLElement;

	private readonly highlightedNodes: Set<string> = new Set();
	private readonly highlightedLinks: Set<Link> = new Set();
	hoveredNode: Node | null;

	private readonly settings: State<GraphSettings>;
	private readonly theme: ObsidianTheme;

	constructor(graph: Graph, rootHtmlElement: HTMLElement, settings: State<GraphSettings>, theme: ObsidianTheme) {
		this.rootHtmlElement = rootHtmlElement;
		this.settings = settings;
		this.theme = theme;

		const [width, height] = [this.rootHtmlElement.innerWidth, this.rootHtmlElement.innerHeight];
		this.instance = ForceGraph3D()(rootHtmlElement)
			.graphData(graph)
			.nodeLabel((node: Node) => node.name)
			.nodeRelSize(this.settings.value.display.nodeSize)
			.backgroundColor(this.theme.backgroundPrimary)
			.width(width)
			.height(height);

		this.createNodes();
		this.createLinks();
	}

	public update_dimensions() {
		const [width, height] = [this.rootHtmlElement.innerWidth, this.rootHtmlElement.innerHeight];
		this.set_dimensions(width, height);
	}

	public set_dimensions(width: number, height: number) {
		this.instance.width(width);
		this.instance.height(height);
	}


	private createNodes = () => {
		this.instance
			.nodeColor((node: Node) => this.highlightedNodes.has(node.id)
			? node === this.hoveredNode
				? this.theme.interactiveAccentHover
				: this.theme.interactiveAccent
			: this.theme.textMuted
		)
			.onNodeHover(this.onNodeHover)
	}

	private onNodeHover = (node: Node | null) => {
		if ((!node && !this.highlightedNodes.size) || (node && this.hoveredNode === node)) return;
		this.clearHighlights();

		if (node) {
			this.highlightedNodes.add(node.id);
			node.neighbors.forEach(neighbor => this.highlightedNodes.add(neighbor.id));
			node.links.forEach(link => this.highlightedLinks.add(link));
		}
		this.hoveredNode = node || null;
		this.updateHighlight();
	}

	private createLinks = () => {
		this.instance.linkWidth((link: Link) => this.highlightedLinks.has(link) ? this.settings.value.display.linkThickness * 1.5 : this.settings.value.display.linkThickness)
			.linkDirectionalParticles((link: Link) => this.highlightedLinks.has(link) ? this.settings.value.display.particleSize : 0)
			.linkDirectionalParticleWidth(4)
			.onLinkHover(this.onLinkHover);
	}

	private onLinkHover = (link: Link | null) => {
		this.clearHighlights();

		if (link) {
			this.highlightedLinks.add(link);
			this.highlightedNodes.add(link.source);
			this.highlightedNodes.add(link.target);
		}
		this.updateHighlight();
	}

	private clearHighlights = () => {
		this.highlightedNodes.clear();
		this.highlightedLinks.clear();
	}

	private updateHighlight() {
		// trigger update of highlighted objects in scene
		this.instance
			.nodeColor(this.instance.nodeColor())
			.linkColor(this.instance.linkColor())
			.linkDirectionalParticles(this.instance.linkDirectionalParticles());
	}

	getInstance(): ForceGraph3DInstance {
		return this.instance;
	}
}
