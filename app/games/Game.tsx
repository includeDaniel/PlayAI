"use client";
import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import Matter from "matter-js";

export default function Game() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const app = new PIXI.Application();

        app.init({
            width: 800,
            height: 600,
            backgroundColor: 0x1099bb,
        }).then(() => {
            containerRef.current?.appendChild(app.view as unknown as Node);

            // --- Matter setup ---
            const engine = Matter.Engine.create();
            engine.gravity.y = 0; // top-down style (no falling)

            const balls: { body: Matter.Body; gfx: PIXI.Graphics }[] = [];

            // Function to create a ball
            function createBall(
                x: number,
                y: number,
                radius = 30,
                color = 0xff0000
            ) {
                const body = Matter.Bodies.circle(x, y, radius, {
                    restitution: 0.8, // bounciness
                    friction: 0.1,
                });
                Matter.World.add(engine.world, body);

                const gfx = new PIXI.Graphics();
                gfx.beginFill(color).drawCircle(0, 0, radius).endFill();
                app.stage.addChild(gfx);

                balls.push({ body, gfx });
            }

            // Create draggable ball (special one)
            createBall(200, 300, 40, 0x00ff00);

            // Create some other balls
            for (let i = 0; i < 5; i++) {
                createBall(400 + i * 70, 300, 30, 0xffaa00);
            }

            // Track dragging
            let dragConstraint: Matter.Constraint | null = null;

            app.stage.eventMode = "static"; // enable pointer events
            app.stage.hitArea = app.screen;

            app.stage.on("pointerdown", (e: PIXI.FederatedPointerEvent) => {
                const pos = e.global;

                // Find ball under pointer
                const picked = balls.find((b) =>
                    Matter.Bounds.contains(b.body.bounds, {
                        x: pos.x,
                        y: pos.y,
                    })
                );

                if (picked) {
                    dragConstraint = Matter.Constraint.create({
                        pointA: { x: pos.x, y: pos.y },
                        bodyB: picked.body,
                        stiffness: 0.1,
                        damping: 0.1,
                    });
                    Matter.World.add(engine.world, dragConstraint);
                }
            });

            app.stage.on("pointermove", (e: PIXI.FederatedPointerEvent) => {
                if (dragConstraint) {
                    dragConstraint.pointA = { x: e.global.x, y: e.global.y };
                }
            });

            app.stage.on("pointerup", () => {
                if (dragConstraint) {
                    Matter.World.remove(engine.world, dragConstraint);
                    dragConstraint = null;
                }
            });

            // Game Loop
            app.ticker.add(() => {
                Matter.Engine.update(engine, 1000 / 60);

                // Sync Matter bodies to Pixi graphics
                for (const { body, gfx } of balls) {
                    gfx.x = body.position.x;
                    gfx.y = body.position.y;
                    gfx.rotation = body.angle;
                }
            });
        });

        return () => {
            app.destroy(true, true);
        };
    }, []);

    return <div ref={containerRef} />;
}
