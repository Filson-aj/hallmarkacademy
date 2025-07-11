"use client";

import React from "react";
import { Dialog } from "primereact/dialog";
import classes from "./Spinner.module.css";

const Spinner = ({ visible, onHide }) => {
    return (
        <Dialog
            visible={visible}
            modal
            onHide={onHide || (() => { })}
            showHeader={false}
            closable={false}
            draggable={false}
            resizable={false}
            blockScroll
            style={{
                width: "100vw",
                height: "100vh",
                maxWidth: "100%",
                maxHeight: "100%",
                padding: 0,
                background: "rgba(0, 0, 0, 0.7)",
            }}
            contentStyle={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                background: "transparent",
            }}
        >
            <span className={classes.Loader} />
        </Dialog>
    );
};

export default Spinner;
